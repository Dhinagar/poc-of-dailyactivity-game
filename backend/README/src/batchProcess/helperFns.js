const fs = require('fs');
const xlsxj = require("xlsx-to-json");
const xlsj = require("xls-to-json");
const fetch = require('node-fetch');
const base64 = require('base-64');
const XLSX = require('xlsx');

const { formatDateTimeUTC } = require('../dateTimeUtils');
const { cuttlyAPI } = require('./constants');

async function shortenURLAsync(url) {
    const urlEncoded = encodeURIComponent(url);
    const response = await fetch(`https://cutt.ly/api/api.php?key=${cuttlyAPI}&short=${urlEncoded}`);
    const data = await response.json();
    return data.url.shortLink;
}


const xlToJsonAsync = (inputFilepath, outputFilepath) => new Promise((resolve, reject) => {
    if (inputFilepath.toLowerCase().endsWith(".xlsx")) {
        xlsxj({
            input: inputFilepath,
            output: outputFilepath
        }, function (err, result) {
            if (err) {
                reject(err);
                return;
            }
            resolve(result);
        });
    }
    else {
        xlsj({
            input: inputFilepath,
            output: outputFilepath
        }, function (err, result) {
            if (err) {
                reject(err);
                return;
            }
            resolve(result);
        });
    }
});

/**
 * Read a file
 * @param {string} filepath Path of the file 
 * @returns {boolean}
 */
const readFileAsync = (filepath) => new Promise((resolve) => {
    fs.readFile(filepath, (err, data) => {
        if (err) {
            resolve(err);
            return;
        }
        resolve(data);
    })
});


/**
 * Check if a file exists for a given path
 * @param {string} filepath Path of the file 
 * @returns {boolean}
 */
const fileExistsAsync = (filepath) => new Promise((resolve) => {
    fs.access(filepath, (err) => {
        if (err) resolve(false);
        resolve(true);
    })
});


const setTimeInterval = (unit, input, isPrior) => {
    const today = new Date();
    const toAdd = isPrior ? -input + 1 : input;
    switch (unit) {
        case "Minutes":
            today.setMinutes(today.getMinutes() + toAdd);
            today.setSeconds(0, 0);
            break;
        case "Hours":
            today.setHours(today.getHours() + toAdd);
            today.setMinutes(0, 0, 0);
            break;
        case "Days":
            today.setDate(today.getDate() + toAdd);
            today.setHours(0, 0, 0, 0);
            break;
        case "Months":
            today.setMonth(today.getMonth() + toAdd);
            today.setDate(1, 0, 0, 0);
            break;
    }
    return formatDateTimeUTC(today);
}

const unlinkAsync = (filepath) => new Promise((resolve, reject) => {
    fs.unlink(filepath, (err) => {
        if (err) reject(err);
        resolve();
    })
})

/**
 * @description A wrapper function for sending SMS using CallCenterServer API.
 * @param {object} config - A system config object 
 * @param {object} logger - A logger object 
 * @param {string} corporate - Name of the corporate 
 * @param {string} categoryId - Category Id
 * @param {string} subCategoryId - Sub Category Id
 */
const sendSMSWrapper = (config, logger, corporate, categoryId, subCategoryId) => {
    /**
     * @description Send SMS using CallCenterServer API.
     * @param {object} smsParams - Object containing fields required for sending SMS.
     * @param {string} smsParams.message - Message to be sent.
     * @param {string} smsParams.phoneNumber - Phone number of the recipient.
     */
    return async ({ message, phoneNumber }) => {

        const { username, passsword: password } = config.getCallCenterServerAuthDetails();
        const url = config.callCenterServerUrl() + "/sms/sendMessageV2";
        const ignorePhoneNumberPrefix = config.ignorePhoneNumberPrefix();
        try {

            if (
                (ignorePhoneNumberPrefix === "")
                ||
                (!(new RegExp(ignorePhoneNumberPrefix)).test(phoneNumber))
            ) {
                const body = {
                    corporate,
                    categoryId,
                    subCategoryId,
                    message,
                    to: phoneNumber
                };

                const options = {
                    method: "POST",
                    body: JSON.stringify(body),
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Basic ${base64.encode(username + ':' + password)}`
                    }
                };
                const response = await fetch(url, options);
                if (response.status >= 400) {
                    logger.error(`Failed to send SMS to ${phoneNumber}...${response}`);
                    return { status: false, message: "Failed to send SMS" }

                }
                const responseData = await response.json();
                if (!responseData.status) {
                    logger.error(`Failed to send SMS to ${phoneNumber}...${JSON.stringify(responseData)}`);
                    return { status: false, message: "Failed to send SMS" }
                }
                // logger.info(`Successfully sent SMS to ${phoneNumber}`);
                //return responseData;
            }
            logger.debug(`Stimulating success sent SMS to phone number ${phoneNumber}`);
            return { status: true, message: "Message sent simulation" }
        } catch (error) {

            logger.error(`Failed to send SMS to ${phoneNumber}...${error}`);
            return { status: false, message: "Failed to send SMS" }
        }
    }
}

/**
 * @description A wrapper function for sending reverse transliterating using InsightEngineServer API.
 * @param {object} config - A system config object
 * @param {object} logger - A logger object
 */
const reverseTransliterateWrapper = (config, logger) => {
    /**
     * @description Reverse transliterate a text using InsightEngine API.
     * @param {object} params - Params for transliteration
     * @param {string} params.text - Text to be transliterated
     * @param {string} params.destinationLang - Language to which the text need to transliterated
     * @param {boolean} params.isNumber - If the text is a numeric value
     * @param {string} params.value - Type of the text value 
     * @returns 
     */
    return async ({ text, destinationLang, isNumber, value }) => {
        try {
            const { username, passsword: password } = config.getinsightengineAuthDetails();
            const url = config.insightengineUrl() + "/generic/translate/getReverseTransliteration";
            const body = {
                text,
                destinationLang,
                isNumber,
                value
            };

            const options = {
                method: 'POST',
                body: JSON.stringify(body),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${base64.encode(username + ':' + password)}`
                }
            };

            const response = await fetch(url, options);

            if (response.status >= 400) {
                logger.error(`Failed to transliterate "${text}"...${response}`)
                return {
                    status: false,
                    message: "Unable to transliterate"
                };
            }
            const responseData = await response.json();
            return responseData;
        } catch (error) {
            logger.error(`Failed to transliterate "${text}"...${error}`);
            return {
                status: false,
                message: "Unable to transliterate"
            };
        }
    }
}

const zeroPad = num => num < 10 ? `0${num}` : `${num}`;

/**
 * @description Gets a UTC formatted date from Date object
 * @param {Date} date - A JavaScript Date object
 * @returns {string} A UTC formatted date. YYYY/MM/DD
 */
const getUTCFormattedDate = (date = new Date()) => `${date.getUTCFullYear()}/${zeroPad(date.getUTCMonth() + 1)}/${zeroPad(date.getUTCDate())} ${zeroPad(date.getUTCHours())}:${zeroPad(date.getUTCMinutes())}:${zeroPad(date.getUTCSeconds())}`;




function getPastDateTime(dateTimeString, minutesBack) {
    let components = dateTimeString.split(" ")
    let dateComponents = components[0].split("/");
    let timeComponents = components[1].split(":");
    let dateTime = new Date(Number(dateComponents[0]), Number(dateComponents[1]) - 1, Number(dateComponents[2]), Number(timeComponents[0]), Number(timeComponents[1]));
    let pastDateTime = new Date(dateTime.getTime() - minutesBack * 60000);
    return pastDateTime.getFullYear() + "/" + zeroPad(pastDateTime.getMonth() + 1) + "/" + zeroPad(pastDateTime.getDate()) + " " + zeroPad(pastDateTime.getHours()) + ":" + zeroPad(pastDateTime.getMinutes()) + ":" + zeroPad(pastDateTime.getSeconds())
}

function clamp_range(range) {
    if (range.e.r >= (1 << 20)) range.e.r = (1 << 20) - 1;
    if (range.e.c >= (1 << 14)) range.e.c = (1 << 14) - 1;
    return range;
}

var crefregex = /(^|[^._A-Z0-9])([$]?)([A-Z]{1,2}|[A-W][A-Z]{2}|X[A-E][A-Z]|XF[A-D])([$]?)([1-9]\d{0,5}|10[0-3]\d{4}|104[0-7]\d{3}|1048[0-4]\d{2}|10485[0-6]\d|104857[0-6])(?![_.\(A-Za-z0-9])/g;

/*
    deletes `nrows` rows STARTING WITH `start_row`
    - ws         = worksheet object
    - start_row  = starting row (0-indexed) | default 0
    - nrows      = number of rows to delete | default 1
*/

function delete_rows(ws, start_row, nrows) {
    if (!ws) throw new Error("operation expects a worksheet");
    var dense = Array.isArray(ws);
    if (!nrows) nrows = 1;
    if (!start_row) start_row = 0;

    /* extract original range */
    var range = XLSX.utils.decode_range(ws["!ref"]);
    var R = 0, C = 0;

    var formula_cb = function ($0, $1, $2, $3, $4, $5) {
        var _R = XLSX.utils.decode_row($5), _C = XLSX.utils.decode_col($3);
        if (_R >= start_row) {
            _R -= nrows;
            if (_R < start_row) return "#REF!";
        }
        return $1 + ($2 == "$" ? $2 + $3 : XLSX.utils.encode_col(_C)) + ($4 == "$" ? $4 + $5 : XLSX.utils.encode_row(_R));
    };

    var addr, naddr;
    /* move cells and update formulae */
    if (dense) {
        for (R = start_row + nrows; R <= range.e.r; ++R) {
            if (ws[R]) ws[R].forEach(function (cell) { cell.f = cell.f.replace(crefregex, formula_cb); });
            ws[R - nrows] = ws[R];
        }
        ws.length -= nrows;
        for (R = 0; R < start_row; ++R) {
            if (ws[R]) ws[R].forEach(function (cell) { cell.f = cell.f.replace(crefregex, formula_cb); });
        }
    } else {
        for (R = start_row + nrows; R <= range.e.r; ++R) {
            for (C = range.s.c; C <= range.e.c; ++C) {
                addr = XLSX.utils.encode_cell({ r: R, c: C });
                naddr = XLSX.utils.encode_cell({ r: R - nrows, c: C });
                if (!ws[addr]) { delete ws[naddr]; continue; }
                if (ws[addr].f) ws[addr].f = ws[addr].f.replace(crefregex, formula_cb);
                ws[naddr] = ws[addr];
            }
        }
        for (R = range.e.r; R > range.e.r - nrows; --R) {
            for (C = range.s.c; C <= range.e.c; ++C) {
                addr = XLSX.utils.encode_cell({ r: R, c: C });
                delete ws[addr];
            }
        }
        for (R = 0; R < start_row; ++R) {
            for (C = range.s.c; C <= range.e.c; ++C) {
                addr = XLSX.utils.encode_cell({ r: R, c: C });
                if (ws[addr] && ws[addr].f) ws[addr].f = ws[addr].f.replace(crefregex, formula_cb);
            }
        }
    }

    /* write new range */
    range.e.r -= nrows;
    if (range.e.r < range.s.r) range.e.r = range.s.r;
    ws["!ref"] = XLSX.utils.encode_range(clamp_range(range));

    /* merge cells */
    if (ws["!merges"]) ws["!merges"].forEach(function (merge, idx) {
        var mergerange;
        switch (typeof merge) {
            case 'string': mergerange = XLSX.utils.decode_range(merge); break;
            case 'object': mergerange = merge; break;
            default: throw new Error("Unexpected merge ref " + merge);
        }
        if (mergerange.s.r >= start_row) {
            mergerange.s.r = Math.max(mergerange.s.r - nrows, start_row);
            if (mergerange.e.r < start_row + nrows) { delete ws["!merges"][idx]; return; }
        } else if (mergerange.e.r >= start_row) mergerange.e.r = Math.max(mergerange.e.r - nrows, start_row);
        clamp_range(mergerange);
        ws["!merges"][idx] = mergerange;
    });
    if (ws["!merges"]) ws["!merges"] = ws["!merges"].filter(function (x) { return !!x; });

    /* rows */
    if (ws["!rows"]) ws["!rows"].splice(start_row, nrows);
}

function formate_Coloumns(ws, colName, fmt) {
    var colNum = XLSX.utils.decode_col(colName); //decode_col converts Excel col name to an integer for col #


    /* get worksheet range */
    var range = XLSX.utils.decode_range(ws['!ref']);
    for (var i = range.s.r + 1; i <= range.e.r; ++i) {
        /* find the data cell (range.s.r + 1 skips the header row of the worksheet) */
        var ref = XLSX.utils.encode_cell({ r: i, c: colNum });
        /* if the particular row did not contain data for the column, the cell will not be generated */
        if (!ws[ref]) continue;
        /* `.t == "n"` for number cells */
        // if (ws[ref].t != 'n') continue;
        /* assign the `.z` number format */
        ws[ref].z = fmt;
    }
}

module.exports = {
    fileExistsAsync,
    xlToJsonAsync,
    unlinkAsync,
    setTimeInterval,
    shortenURLAsync,
    sendSMSWrapper,
    reverseTransliterateWrapper,
    readFileAsync,
    getUTCFormattedDate,
    getPastDateTime,
    delete_rows,
    formate_Coloumns,
    zeroPad
}
