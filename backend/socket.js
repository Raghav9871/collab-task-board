const io = require("./server"); 

io.on("connection", (socket) => {
  console.log("🟢 A user connected");

  socket.on("new-task", () => {
    socket.broadcast.emit("refresh-tasks");
  });

  socket.on("update-task", () => {
    socket.broadcast.emit("refresh-tasks");
  });

  socket.on("disconnect", () => {
    console.log("🔴 A user disconnected");
  });
});
