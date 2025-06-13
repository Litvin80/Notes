require("dotenv").config();

const config = require("./config.json");
const mongoose = require("mongoose");

mongoose.connect(config.connectionString);

const User = require("./models/user.model");
const Note = require("./models/note.model");

const express = require("express");
const cors = require("cors");
const app = express();

const jwt = require("jsonwebtoken");
const { authenticateToken } = require("./utilities");

app.use(express.json());

app.use(
  cors({
    origin: "https://notesappme.netlify.app",
    credentials: true,
  })
);


app.get("/", (req, res) => {
  res.json({ data: "Привіт!" });
});

app.post("/create-account", async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName) {
    return res
      .status(400)
      .json({ error: true, message: "Повне ім’я є обов’язковим" });
  };
  
  if (!email) {
    return res
      .status(400)
      .json({ error: true, message: "Пошта є обов’язковою" });
  };

  if (!password) {
    return res
      .status(400)
      .json({ error: true, message: "Пароль є обов’язковим" });
  };

  const isUser = await User.findOne({ email: email });

  if (isUser) {
    return res.json({
      error: true,
      message: "Користувач вже зареєстрований",
    })
  };

  const user = new User({
    fullName,
    email,
    password,
  });

  await user.save();

  const accessToken = jwt.sign({ user
    }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "3600m",
    }
  );
  
  return res.json({
    error: false,
    user,
    accessToken,
    message: "Реєстрація успішна",
  })
});

app.get("/get-user", authenticateToken, async(req, res) => {
  const { user } = req.user;

  const isUser = await User.findOne({ _id: user._id });

  if (!isUser) {
    return res.sendStatus(401);
  };

  return res.json({ 
    user: { 
      fullName: isUser.fullName,
      email: isUser.email,
      "_id": isUser._id,
      createdOn: isUser.createdOn
    },
    message: "" 
  });
});

app.post("/login", async(req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ message: "Пошта є обов’язковою" });
  };

  if (!password) {
    return res
      .status(400)
      .json({ message: "Пароль є обов’язковим" });
  };

  const userInfo = await User.findOne({ email: email });

  if (!userInfo) {
    return res
      .status(400)
      .json({ message: "Користувача не знайдено" });
  };

  if (userInfo.email == email && userInfo.password == password) {
    const user = { user: userInfo };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "3600m",
    });

    return res.json({
    error: false,
    message: "Вхід успішний",
    email,
    accessToken,
    });
  } else {
    return res.status(400).json({
      error: true,
      message: "Неправильні дані для входу",
    });
  };  
});


app.post("/add-note", authenticateToken, async(req, res) => {
  const { title, content, tags } = req.body;
  const { user } = req.user;

  if (!title) {
    return res
      .status(400)
      .json({ error: true, message: "Заголовок є обов'язковим" });
  };

  if (!content) {
    return res
      .status(400)
      .json({ error: true, message: "Опис є обов'язковим" });
  };

  try {
    const note = new Note({
      title,
      content,
      tags: tags || [],
      userId: user._id,
    });

    await note.save();

    return res.json({
      error: false,
      note,
      message: "Нотатка успішно додана",
    });
  } catch(error) {
    return res
      .status(500)
      .json({ error: true, message: "Внутрішня помилка сервера" 
    });
  }
});

app.put("/edit-note/:noteId", authenticateToken, async(req, res) => {
  const noteId = req.params.noteId;
  const { title, content, tags, isPinned } = req.body;
  const { user } = req.user;
  
  if (!title && !content && !tags) {
    return res
      .status(400)
      .json({ error: true, message: "Зміни не були вказані"});
  };

  try {
    const note = await Note.findOne({ _id: noteId, userId: user._id });

    if (!note) {
      return res
        .status(404)
        .json({ error: true, message: "Нотатку не знайдено" });
    };

    if (title) note.title = title;
    if (content) note.content = content;
    if (tags) note.tags = tags;
    if (isPinned) note.isPinned = isPinned;

    await note.save();

    return res.json({
      error: false,
      note,
      message: "Нотатку оновлено успішно",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Внутрішня помилка сервера" 
    });
  };
});

app.get("/get-all-notes/", authenticateToken, async(req, res) => {
  const { user } = req.user;
  
  try {
    const notes = await Note
      .find({ userId: user._id })
      .sort({ isPinned: -1 });

    return res.json({
      error: false,
      notes,
      message: "Всі нотатки успішно завантажено",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Внутрішня помилка сервера" 
    });
  };
});

app.delete("/delete-note/:noteId", authenticateToken, async(req, res) => {
  const noteId = req.params.noteId;
  const { user } = req.user;

  try {
    const note = await Note.findOne({ _id: noteId, userId: user._id });

    if (!note) {
      return res
        .status(404)
        .json({ error: true, message: "Нотатку не знайдено" });
    };

    await Note.deleteOne({ _id: noteId, userId: user._id });

    return res.json({
      error: false,
      message: "Нотатку успішно видалено",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Внутрішня помилка сервера" 
    });
  };
});

app.put("/update-note-pinned/:noteId", authenticateToken, async(req, res) => {
  const noteId = req.params.noteId;
  const { isPinned } = req.body;
  const { user } = req.user;

  try {
    const note = await Note.findOne({ _id: noteId, userId: user._id });

    if (!note) {
      return res
        .status(404)
        .json({ error: true, message: "Нотатку не знайдено" });
    };

    note.isPinned = isPinned;

    await note.save();

    return res.json({
      error: false,
      note,
      message: "Нотатку оновлено успішно",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Внутрішня помилка сервера" 
    });
  };
});

app.get("/search-notes/", authenticateToken, async(req, res) => {
  const { user } = req.user;
  const { query } = req.query;

  if (!query) {
    return res
      .status(400)
      .json({ error: true, message: "Пошуковий запит є обов'язковим" });
  };

  try {
    const matchingNotes = await Note.find({ 
      userId: user._id,
      $or: [
        { title: { $regex: new RegExp(query, 'i') } },
        { content: { $regex: new RegExp(query, 'i') } },
      ],
    });
    return res.json({
      error: false,
      notes: matchingNotes,
      message: "Нотатки за пошуковим запитом успішно отримані",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Внутрішня помилка сервера" 
    });
  };
});

app.listen(8000);

module.exports = app;