Open a cmd-promt at the root folder.
<<src>> holds the local source code, where the development happens.

All commands are executed at the root folder.

At the very start, we need to execute following, to ensure gulp and npm runtime is enabled for all the used plugins;
>npm install

For <<Trunk>> based development, the process is as below. Trunk is used to close bugs for a Tag-ed release.
>gulp checkout-trunk (This checks out the code from SVN Trunk. PLEASE NOTE: This command will clear all old source code in the src folder if any and replace it with the latest SVN Trunk code)
>gulp work-commit (This does release checkin/commit)
>gulp work-check (This checks the local modifications done)
>gulp work-update (This updates the trunk code into local working copy)
>gulp work-diff (This shows the differences of the  local working copy with the SVN version that was last checked out or updated)

For <<Branch>> based development, the process is as below. Branch is used to develop a new feature of category or a new catageory, for a Tag-ed release. Branch always has a version no. associated.
>gulp checkout-branch (This checks out the code from the relevant Branch. PLEASE NOTE: This command will clear all old source code in the src folder if any and replace it with the latest SVN Branch code)
>gulp work-commit (This does release checkin/commit)

Once the branch based development is finalized and ready to be made as a part of the mainline code, This needs an execution of command;
> gulp fwdMerge (This command has to be executed only after all code has been checked in/commited to the relevant branch)

For either a Trunk or a Branch based development, one has to do a Merge of the development-in-progress code, against a Tag-version, based on the direction of DevOps Manager. This needs an execution of command;
>gulp revMerge (The development-in-progress code is brought in-sync to the Tag-Version prompted)

PLEASE NOTE:
1. When Executing any of the above devops commands make sure u have saved all your files and exited from all programs running from withing the <<src>> folder.
2. Many of the commands attempt to keep a backup of the <<src>> in the <<dist/backup>> folder
3. If u need to ignore some auto-generated files from being checked in create a file named "ignore.devops" in the root directory with every glob pattern to be ignored on a newline.


  