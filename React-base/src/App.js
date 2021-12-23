import React, {useState} from "react";
import TaskList from "./TaskList";
import TaskForm from "./TaskForm";

function App() {
    // 定义状态变量
    const [tasks, setTasks] = useState([]);		// 第二个是修改变量的函数，执行会触发状态事件
    const [taskId, setTaskId] = useState(0);	// 第二个是修改变量的函数，执行会触发状态事件


    function createTask(desc) {     // 说明：该函数被下级组件调用后就能传递数据完成赋值
        setTasks([...tasks, {id: taskId, description: desc, done: false}])
        setTaskId(taskId + 1)
    }

    function setTaskDone(taskId) {  // 说明：该函数被下级组件调用后就能传递数据完成赋值
        let newTasks = tasks.map(task => {
            if (task.id === taskId) {
                task.done = true;
            }
            return task
        })
        setTasks(newTasks)
    }

    function deleteTask(taskId) {   // 说明：该函数被下级组件调用后就能传递数据完成赋值
        setTasks(tasks.filter(task => task.id !== taskId))
    }

    return (
        <div className="container">
            <div className="row">
                <div className="col">
                    <div className="App">
                        <div className="m-4 p-5 bg-light text-dark rounded">
                            <h1>Hello React</h1>
                        </div>
                        {/* 引用组件，向下传递数据 */}
                        <TaskForm creatTask={createTask}/>
                        {/* 引用组件，向下传递数据 */}
                        <TaskList tasks={tasks} setTaskDone={setTaskDone} deleteTask={deleteTask}/>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
