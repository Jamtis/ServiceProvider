const exec = require("child_process").exec;
const gulp = require("gulp");
const {
    bundles, modules
} = require("./gulpfile.json");
for (const bundle in bundles) {
    const tasks = bundles[bundle];
    for (const task_name in tasks) {
        try {
            const task = tasks[task_name];
            gulp.task(task_name, () => {
                const gulp_watch = require("gulp-watch");
                let pipe_part;
                if (task.watch) {
                    pipe_part = gulp_watch(task.src, modules["gulp-watch"]);
                } else {
                    pipe_part = gulp.src(task.src);
                }
                for (const part of task.chain) {
                    const module_name = typeof part == "string" ? part : part.module;
                    const pipe_function = require(module_name);
                    const settings = Object.assign({}, part.settings, modules[module_name]);
                    pipe_part = pipe_part.pipe(pipe_function(settings));
                    pipe_part.on("error", error => console.error(error.toString()));
                }
                pipe_part = pipe_part.pipe(gulp.dest(task.dest));
                return pipe_part;
            });
        } catch (e) {
            console.error(e);
        }
    }
    gulp.task(bundle, Object.getOwnPropertyNames(tasks));
    gulp.task("init-" + bundle, () => new Promise((resolve, reject) => {
        exec("npm install --save-dev gulp-watch " + Object.getOwnPropertyNames(modules).join(" "), error => {
            (error ? reject : resolve)();
        });
    }));
}
{
    const bundle_array = Object.getOwnPropertyNames(bundles);
    gulp.task("default", bundle_array);
    gulp.task("init", bundle_array.map(bundle => "init-" + bundle));
}