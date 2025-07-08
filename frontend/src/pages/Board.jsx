import socket from "../socket";
import { useEffect, useState } from "react";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "../styles/board.css";

const columns = ["Todo", "In Progress", "Done"];

const Board = () => {
  const { user, token, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium",
  });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskData, setEditTaskData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    updatedAt: "",
  });

  const fetchTasks = async () => {
    try {
      const res = await axios.get("/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get("/logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch logs");
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchLogs();
    socket.on("refresh-tasks", () => {
      fetchTasks();
      fetchLogs();
    });
    return () => {
      socket.off("refresh-tasks");
    };
  }, []);

  const groupedTasks = columns.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status);
    return acc;
  }, {});

  const handleTaskChange = (e) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/tasks", newTask, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewTask({ title: "", description: "", priority: "Medium" });
      fetchTasks();
      socket.emit("new-task");
    } catch (err) {
      alert(err.response?.data?.message || "Error creating task");
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    try {
      await axios.put(
        `/tasks/${draggableId}`,
        { status: destination.droppableId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchTasks();
      socket.emit("update-task");
    } catch (err) {
      console.error("Failed to update task status", err);
    }
  };

  const smartAssign = async (taskId) => {
    try {
      await axios.put(
        `/tasks/${taskId}/smart-assign`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTasks();
      socket.emit("update-task");
    } catch (err) {
      alert("Smart assign failed");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await axios.delete(`/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
      socket.emit("update-task");
    } catch (err) {
      alert("Failed to delete task");
    }
  };

  const toggleEdit = (task) => {
    setEditingTaskId(task._id);
    setEditTaskData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      updatedAt: task.updatedAt,
    });
  };

  const handleEditChange = (e) => {
    setEditTaskData({ ...editTaskData, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/tasks/${editingTaskId}`, editTaskData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditingTaskId(null);
      fetchTasks();
      socket.emit("update-task");
    } catch (err) {
      if (err.response?.status === 409) {
        const serverTask = err.response.data.serverTask;
        const userTask = err.response.data.userTask;

        const choice = window.confirm(
          "Someone else has updated this task.\n\nClick OK to overwrite with your version.\nClick Cancel to keep the server version."
        );

        if (choice) {
          await axios.put(
            `/tasks/${editingTaskId}`,
            { ...userTask, force: true },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          fetchTasks();
          socket.emit("update-task");
          setEditingTaskId(null);
        } else {
          fetchTasks();
          setEditingTaskId(null);
        }
      } else {
        alert("Update failed.");
      }
    }
  };

  return (
    <div className="board-container">
      <div className="header">
        👤 Welcome, {user?.name}
        <button style={{ float: "right", borderRadius:"5px", backgroundColor:"#2196f3", color: "white", border:"0", padding:"5px" }} onClick={logout}>
          Logout
        </button>
      </div>

      <form onSubmit={handleAddTask} className="task-form">
        <h3>Create Task</h3>
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={newTask.title}
          onChange={handleTaskChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={newTask.description}
          onChange={handleTaskChange}
          required
        />
        <select
          name="priority"
          value={newTask.priority}
          onChange={handleTaskChange}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <button type="submit">Add Task</button>
      </form> 

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban">
          {columns.map((col) => (
            <Droppable droppableId={col} key={col}>
              {(provided) => (
                <div
                  className="column"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <h3>{col}</h3>
                  {groupedTasks[col]?.map((task, index) => (
                    <Draggable
                      draggableId={task._id}
                      index={index}
                      key={task._id}
                    >
                      {(provided) => (
                        <div
                          className="task-card"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          {editingTaskId === task._id ? (
                            <form onSubmit={handleSaveEdit}>
                              <input
                                type="text"
                                name="title"
                                value={editTaskData.title}
                                onChange={handleEditChange}
                                required
                              />
                              <textarea
                                name="description"
                                value={editTaskData.description}
                                onChange={handleEditChange}
                                required
                              />
                              <select
                                name="priority"
                                value={editTaskData.priority}
                                onChange={handleEditChange}
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                              </select>
                              <button type="submit">Save</button>
                              <button
                                type="button"
                                onClick={() => setEditingTaskId(null)}
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <>
                              <strong>{task.title}</strong>
                              <p>{task.description}</p>
                              <small>Priority: {task.priority}</small>
                              <br />
                              <small>
                                Assigned To:{" "}
                                {task.assignedTo?.name || "Unassigned"}
                              </small>
                              <br />
                              <button onClick={() => smartAssign(task._id)}>
                                Smart Assign
                              </button>
                              <button onClick={() => toggleEdit(task)}>
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task._id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <div className="log-section">
        <h3>Activity Log (Last 20)</h3>
        <ul>
          {logs.map((log) => (
            <li key={log._id}>
              <strong>{log.userId?.name || "Someone"}</strong> {log.action} —{" "}
              <em>{log.taskId?.title || "a task"}</em> at{" "}
              {new Date(log.timestamp).toLocaleTimeString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Board;
