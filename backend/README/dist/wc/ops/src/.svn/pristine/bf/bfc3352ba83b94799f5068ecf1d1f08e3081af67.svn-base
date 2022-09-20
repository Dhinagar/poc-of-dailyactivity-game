exports.formatNowDateTime = function () {
	var dt = new Date();
	return formatDateTime(dt);
}

exports.formatNowDateTimeUTC = function () {
	var dt = new Date();
	return formatDateTimeUTC(dt);
}

exports.formatNowDateTimeUTCUnit = function (unit) {
	var dt = new Date();
	return formatDateTimeUTC(dt, unit);
}

exports.formatDateTimeUTC = function (dt) {
	return formatDateTimeUTC(dt);
}

exports.formatDateTimeUTCUnit = function (dt, unit) {
	return formatDateTimeUTC(dt, unit);
}

exports.convertToDateTime = function (dateStr) {
	let comp = dateStr.split(" ");
	let dateComp = comp[0].split("/");
	let timeComp = comp[1].split(":");
	return new Date(dateComp[0], Number(dateComp[1]) - 1, dateComp[2], timeComp[0], timeComp[1], timeComp[2], 0);
}

/**************************************************************************************************/
function formatDateTimeUTC(dt, units) {
	if (units) {
		if (units == "Minutes") {
			return dt.getUTCFullYear() + "/" + _pad(dt.getUTCMonth() + 1) + "/" + _pad(dt.getUTCDate()) + " " + _pad(dt.getUTCHours()) + ":" + _pad(dt.getUTCMinutes()) + ":00";
		}
		else if (units == "Hours") {
			return dt.getUTCFullYear() + "/" + _pad(dt.getUTCMonth() + 1) + "/" + _pad(dt.getUTCDate()) + " " + _pad(dt.getUTCHours()) + ":00:00";
		}
		else if (units == "Days") {
			return dt.getUTCFullYear() + "/" + _pad(dt.getUTCMonth() + 1) + "/" + _pad(dt.getUTCDate()) + " " + "00:00:00";
		}
		else if (units == "Months") {
			return dt.getUTCFullYear() + "/" + _pad(dt.getUTCMonth() + 1) + "/01 00:00:00";
		}
	}
	return dt.getUTCFullYear() + "/" + _pad(dt.getUTCMonth() + 1) + "/" + _pad(dt.getUTCDate()) + " " + _pad(dt.getUTCHours()) + ":" + _pad(dt.getUTCMinutes()) + ":" + _pad(dt.getUTCSeconds());
}

function formatDateTime(dt) {
	return dt.getFullYear() + "/" + _pad(dt.getMonth() + 1) + "/" + _pad(dt.getDate()) + " " + _pad(dt.getHours()) + ":" + _pad(dt.getMinutes()) + ":" + _pad(dt.getSeconds());
}

function _pad(num) {
	return ("00" + num).slice(-2)
}
