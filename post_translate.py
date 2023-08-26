import logging
import os
import subprocess
import sys

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def execute_call(command, quiet=True, quiet_err=False, exit_script=True):
    kwargs = {'shell': True}
    if quiet:
        kwargs['stdout'] = subprocess.DEVNULL
    if quiet_err:
        kwargs['stderr'] = subprocess.DEVNULL
    code = subprocess.call(command, **kwargs)
    if code != 0 and exit_script:
        logger.info('COMMAND CALL ===> ' + command)
        sys.exit(int(code))
    return code


commands = []

# mkdir
commands.append(
    "mkdir -p $REPO_DIR/shared/assets/markdowns")
# copy docs
commands.append(
    "cp -fR $DOWNLOADS_DIR/ca-docs/docs $REPO_DIR/shared/assets/markdowns/")
# copy images
commands.append(
    "cp -fR $DOWNLOADS_DIR/ca-docs/images $REPO_DIR/shared/assets/markdowns/")
# copy  icons
commands.append(
    "cp -fR $DOWNLOADS_DIR/ca-docs/icons $REPO_DIR/shared/assets/markdowns/")
# copy json
commands.append(
    "cp -f $DOWNLOADS_DIR/ca-docs/docs.json $REPO_DIR/shared/assets/markdowns/docs.json")
commands.append(
    "cp -f $DOWNLOADS_DIR/ca-docs/categories.json $REPO_DIR/shared/assets/markdowns/categories.json")
# copy js
commands.append(
    "cp -f $DOWNLOADS_DIR/ca-docs/routes.js $REPO_DIR/shared/assets/markdowns/routes.js")


locale_dir = "{}/ca-docs/translate".format(os.environ['DOWNLOADS_DIR'])
locales = [f.name for f in os.scandir(locale_dir) if f.is_dir()]
for locale in locales:
    # mkdir
    commands.append(
        "mkdir -p $REPO_DIR/shared/options/{0}/docs".format(locale))
    commands.append(
        "cp -fR $DOWNLOADS_DIR/ca-docs/translate/{0}/* $REPO_DIR/shared/options/{0}/docs".format(locale))



for command in commands:
    execute_call(command)
