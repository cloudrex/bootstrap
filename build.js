const automata = require("@atlas/automata");
const CoordinatorState = automata.CoordinatorState;
const colors = require("colors");
const os = require("os");

const coordinator = new automata.Coordinator();
const buildDir = process.env.BUILD_DIR ? process.env.BUILD_DIR.toLocaleLowerCase() : "./dist";
const buildMode = process.env.BUILD_MODE ? process.env.BUILD_MODE.toLowerCase() : "default";
const versionLock = [8, 11];

// TODO: Implement different build modes
async function build() {
    const result = await coordinator
        .then(() => {
            const nodeJsVersion = process.version.substr(1).split(".")[0];
            const nodeJsMajor = parseInt(nodeJsVersion);

            console.log(`Platform: ${os.platform()} | ${os.arch()}`);
            console.log(`Project v${process.env.npm_package_version}`);
            console.log(`NodeJS ${process.version}`);

            if (nodeJsMajor < versionLock[0] || nodeJsMajor > versionLock[1]) {
                console.log(`This script requires NodeJS >=v${versionLock[0]} and <=v${versionLock[1]}`);

                return false;
            }
            else if (buildMode !== "default") {
                console.log(`Unsupported build mode: ${buildMode}`);

                return false;
            }

            console.log(`\nUsing mode: ${buildMode}`)
            console.log("Building project");
        })

        .then(() => automata.FileSystemOperations.forceRemove(buildDir), true)
        .then(() => automata.ScriptOperations.execute("tsc", undefined, true))

        .fallback(async () => {
            console.log("Running fallback sequence");
            await automata.FileSystemOperations.forceRemove(buildDir);
        })

        .run();

    const state = result.state === CoordinatorState.OK ? "passing" : "failed";
    const color = result.state === CoordinatorState.OK ? colors.green : colors.red;

    console.log(color(`\n  Build ${state} | Took ${result.time}ms (${result.averageTime}ms avg.) | ${result.operationsCompleted}/${result.operations} task(s)`));

    return result.operations === result.operationsCompleted ? 0 : 1;
}

build()
    .then((code) => process.exit(code));
