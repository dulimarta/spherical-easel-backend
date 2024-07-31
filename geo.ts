import express, { Request, Response } from "express";
import { createServer } from "http";
import { Socket, Server } from "socket.io";
import { v1 as uuidv1 } from "uuid";
// import firebase from "firebase";
// import { firebaseFirestore } from "./firebase-backend";
import { DateTime } from "luxon";
const app = express();
const router = express.Router();
const my_server = createServer(app);

const server_io = new Server(my_server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"],
  },
});

type participantDetails = {
  name: string,
  socketId: string
}
type StudioDetails = {
  id: string;
  socketId: string;
  instructor: string;
  name: string;
  participants: Array<participantDetails>;
};

const availableStudios: Array<StudioDetails> = [];

server_io.of("/").adapter.on("create-room", (room) => {
  console.debug(`A new room ${room} was just created`);
});
server_io.of("/").adapter.on("delete-room", (room) => {
  console.debug(`A new room ${room} was just deleted`);
});

server_io.of("/").adapter.on("join-room", (room, who) => {
  if (who !== room) console.debug(`Socket ${who} just joined room ${room}`);
  // else console.debug(`Socket ${who} just joined its own room`);
});

server_io.of("/").adapter.on("leave-room", (room, who) => {
  if (who !== room) console.debug(`Socket ${who} just left room ${room}`);
  // else console.debug(`Socket ${who} just left its own room`);
});

server_io.on("connection", (socket: Socket) => {
  console.debug(`Got a new connection from client ${socket.id}`);

  socket.on("disconnecting", (why: string) => {
    console.debug(`Socket ${socket.id} is about to disconnect. Reason ${why}`);
    const studioPos = availableStudios.findIndex(st => st.socketId === socket.id)
    /* Check if this client is a teacher who has created a studio */
    if (studioPos >= 0) {
      const details = availableStudios[studioPos]
      console.debug(`Deleting studio ${details.name} (${details.id})`)
      availableStudios.splice(studioPos, 1)
    } else {
      console.debug(`Socket ${socket.id} did not create any studio`)
    }

    /* Check if this client is a participant who has joined a studio */
    availableStudios.some((st, stIndex, arr) => {
      console.debug(`Checking ${socket.id} in ${st.name}`)
      const pos = st.participants.findIndex(p => {
        console.debug(`${p.name} ${p.socketId}`)
        return p.socketId === socket.id
      })
      if (pos >= 0) {
        console.debug(`Removing participant ${st.participants[pos].name} from ${st.name}`)
        arr[stIndex].participants.splice(pos, 1)
        return true
      }
    })
  });

  /* Events that originate at a Teacher */
  socket.on(
    "open-studio",
    (args: Omit<StudioDetails, "id" | "participants">, responseFn) => {
      const studioId = uuidv1();
      // socket.join(studioId);
      availableStudios.push({
        ...args,
        id: studioId,
        participants: [],
        socketId: socket.id,
      });
      // The instructor should join its own studio so it can listen
      // to arriving participants
      socket.join(studioId)
      // socket.join(`chat-${studioId}`);

      console.debug("Sending response back to teacher client", studioId);
      responseFn(studioId);
      // await firebaseFirestore.collection("sessions").doc(socket.id).set({
      //   owner: args.who,
      //   createdAt: DateTime.now().toUTC().toISO(),
      //   members: [],
      // });
    }
  );

  socket.on("close-studio", async (studioId: string) => {
    console.debug("Server received 'close-studio' event", studioId);
    const pos = availableStudios.findIndex((s) => s.id === studioId);
    if (pos >= 0) {
      //console.debug("About to delete studio", availableStudios[pos].name);
      availableStudios.splice(pos, 1);
    } else {
      //console.debug(`Studio ${studioId} does not exist`);
    }
    socket.leave(studioId);
    server_io.in(studioId).emit("studio-end");
    // socket.to(`chat-${socket.id}`).emit("studio-end");
    // socket.leave(`chat-${socket.id}`);
    // socket.leave(`cmd-${socket.id}`);
    socket.disconnect();
    // await collection(firebaseFirestore, "sessions").doc(socket.id).delete();
  });

  // socket.on("ui-control", (args) => {
  //   console.debug("Backend server got ui-control", args);
  //   socket.to(`chat-${socket.id}`).emit("ui-control", args);
  // });

  socket.on("notify-all", (arg: { room: string; message: string }) => {
    console.debug("Server received 'notify-all", arg.room);
    if (arg.room.startsWith("chat:")) {
      socket.to(arg.room).emit("chat-msg", arg.message);
    } else if (arg.room.startsWith("cmd:"))
      socket.to(arg.room).emit("exec-cmd", arg.message);
  });

  /* Events that originate at a student */
  socket.on("studio-query", (responseFn) => {
    if (process.env.mode !== 'production') {
      console.debug("Get studio query request....");
    }
    responseFn(JSON.stringify(availableStudios));
  });

  socket.on("student-join", (arg: { session: string; who: string, socketId:string }) => {
    const pos = availableStudios.findIndex((z) => z.id === arg.session);
    if (pos >= 0) {
      const chatRoom = `chat:${arg.session}`; // For text messages
      const cmdRoom = `cmd:${arg.session}`; // For geometric commands
      socket.join(arg.session);
      server_io.in(arg.session).emit("new-participant", arg.who);
      socket.join(chatRoom);
      socket.join(cmdRoom);
      availableStudios[pos].participants.push({ name: arg.who, socketId: socket.id });
    }
    // await firebaseFirestore
    //   .collection("sessions")
    //   .doc(arg.session)
    //   .update({ members: firebase.firestore.FieldValue.arrayUnion(arg.who) });
  });

  socket.on(
    "student-leave",
    async (arg: { session: string; who: string, socketId: string }, responseFn) => {
      if (process.env.mode !== 'production') {
        console.debug("Server received 'student-leave' by student ",
          arg.who, "from studio", arg.session, "on socket", socket.id);
      }
      server_io.in(arg.session).emit("drop-participant", arg.who);
      socket.leave(arg.session);

      const sessionIndex = availableStudios.findIndex(
        (s) => s.id === arg.session
      );
      if (sessionIndex < 0) {
        if (process.env.mode !== 'production') {
          console.debug("student-leave: studio does not exist")
        }
        responseFn(false);
      } else {
        const participantIndex = availableStudios[
          sessionIndex
        ].participants.findIndex((p) => p.name === arg.who || p.socketId === arg.socketId);
        if (participantIndex < 0) {
          if (process.env.mode !== 'production') {
            console.debug("student-leave: participant does not exist")
          }
          responseFn(false);
        } else {
          availableStudios[sessionIndex].participants.splice(
            participantIndex,
            1
          );
          // const msgRoom = `chat-${arg.session}`; // For text messages
          // const cmdRoom = `cmd-${arg.session}`; // For geometric commands
          // socket.leave(msgRoom);
          // socket.leave(cmdRoom);
          responseFn(true);
        }
        // await firebaseFirestore
        //   .collection("sessions")
        //   .doc(arg.session)
        //   .update({ members: firebase.firestore.FieldValue.arrayRemove(arg.who) });
      }
    }
  );
});

// Full path to this entry is /geo/sessions
router.get("/sessions", (req: Request, res: Response) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  const rooms = server_io.of("/").adapter.rooms;
  const sids = server_io.of("/").adapter.sids
  if (process.env.mode !== 'production') {
    console.debug("Incoming request is", req.originalUrl);
    console.debug("Rooms", rooms);
  }

  if (rooms.size > 0) {
    res.write("<h1>List of rooms</h1>");
    res.write("<ol>");
    for (let r of rooms.keys()) {
      const thisRoom = rooms.get(r)!;
      res.write(
        `<li>Room <code>${r}</code>: with participants ${Array.from(
          thisRoom?.values()
        )}</li>`
      );
    }
    res.write("</ol>");
  } else {
    res.write("<h1>No active studio</h1>");
  }
  res.end();
});

router.get("/studios", (req: Request, res: Response) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
  res.write(`<h1>List of studios ${availableStudios.length}</h1>`)
  res.write("<ol>")
  availableStudios.forEach((st) => {
    res.write(`<li>${st.name} (${st.id}) [${st.socketId}] ${st.participants.length} members`)
    res.write("<ul>")
    st.participants.forEach(p => {
      res.write(`<li>${[p.name]} -- ${p.socketId}</li>`)
    })
    res.write("</ul>")
  })
  res.write("</ol")
  res.end()
})
// router.get("/student", (req: Request, res: Response) => {
//   res.writeHead(200, { 'Content-Type': 'text/html' });
//   console.debug("Incoming request is", req);
//   res.end();
// });

// The last component of the path below must match the
// File name under src/app-server
// app.use("/.netlify/functions/geo", router);
app.use("/", router);
const port = process.env.PORT || 4000;
my_server.on('request', (req, res) => {
  console.log("Incoming request", req.headers)
})
my_server.on('connect', (req, sock) => {
  console.log("HTTP server connect", req.headers, "on Socket")
})
my_server.on('connection', (str) => {
  console.log(`HTTP server connection |${str.localAddress}:${str.localPort}|`)
})
my_server.listen(port, () => {
  console.log(`ExpressJS server listening on port ${port}`);
});
