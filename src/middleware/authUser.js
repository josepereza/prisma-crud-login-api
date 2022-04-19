const jwt = require('jsonwebtoken')

const fetchuser = (req, res, next) => {
  try {
    const token = req.header('auth-token')
    if (!token) {
      res.status(400).json({ error: 'please use a valid authentication token' })
    }
    const verifyToken = jwt.verify(token, process.env.DATABASE_URL)
    req.user = verifyToken.id
    next()
  } catch (err) {
    console.log(err)
    res.status(400).json({ error: 'please use a valid authentication token' })
  }
}

module.exports = fetchuser
