const express = require('express')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const fetchuser = require('./middleware/authUser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const app = express()
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use(express.json())

app.get('/api', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate')
  res.json('Hello World')
})
app.get('/api/fetchnotes', fetchuser, async (req, res) => {
  const notes = await prisma.note.findMany({
    where: {
      userId: req.user,
    },
  })
  res.json(notes)
})

app.get('/api/note/:id', fetchuser, async (req, res) => {
  const note = await prisma.note.findUnique({
    where: {
      id: req.params.id,
    },
  })
  res.json(note)
})

app.post(`/api/note`, fetchuser, async (req, res) => {
  const { title, content, tag } = req.body
  const note = await prisma.note.create({
    data: {
      title: title,
      content: content,
      tags: tag,
      user: {
        connect: {
          id: req.user,
        },
      },
    },
  })
  res.json(note)
})
app.put(`/api/note/:id`, fetchuser, async (req, res) => {
  const { title, content, tags, published } = req.body
  const note = await prisma.note.update({
    where: {
      id: req.params.id,
    },
    data: {
      title,
      content,
      tags,
      published,
    },
  })
  res.json(note)
})

app.delete(`/api/note/:id`, fetchuser, async (req, res) => {
  const note = await prisma.note.delete({
    where: {
      id: req.params.id,
    },
  })
  res.json({ msg: 'Note Deleted', note })
})

app.post(`/api/signup`, async (req, res) => {
  const { name, email, password } = req.body
  const useremail = await prisma.user.findUnique({
    where: {
      email: email,
    },
  })

  if (useremail) {
    res.status(400).json('user with this email already exists')
  }

  const salt = await bcrypt.genSalt(10)
  const hashedPwd = await bcrypt.hash(password, salt)

  const user = await prisma.user.create({
    data: {
      name: name,
      email: email,
      password: hashedPwd,
    },
  })
  const payload = {
    user: {
      id: user.id,
    },
  }
  const token = jwt.sign(payload.user, process.env.DATABASE_URL)
  res.json({ Status: 'OK', token: token })
})

app.post('/api/login', async (req, res) => {
  let { email, password } = req.body
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
    select: {
      password: true,
    },
  })

  if (!user) {
    res.status(400).json({ error: 'Please try to login with correct Email' })
  }

  const pwdCompare = await bcrypt.compare(password, user.password)

  if (!pwdCompare) {
    return res
      .status(400)
      .json({ error: 'Please try to login with correct Password' })
  }

  const payload = {
    user: {
      id: user.id,
    },
  }
  const authtoken = jwt.sign(payload.user, process.env.DATABASE_URL)

  if ((user, pwdCompare)) {
    return (
      res.json({ Status: 'OK', token: authtoken }),
      console.log({ email: email, pwd: password })
    )
  } else {
    res.json({ Status: 'NOT OK' })
  }
})

const server = app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000
⭐️ See sample requests: http://pris.ly/e/ts/rest-express#3-using-the-rest-api`),
)
