require('dotenv').config()

const express = require('express')
const server = require('./server')

const app = express()
const PORT = process.env.PORT || 3000

app.use('/', server)

app.get('*', (req, res) => {
  res.status(404).send('Route not found')
})

const httpServer = app.listen(PORT, () => {
  console.info(`server demarre sur le port ${PORT}`)
})

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Le port ${PORT} est deja utilise. Arretez le processus en cours ou utilisez un autre port (ex: PORT=3001).`)
    process.exit(1)
  }

  throw err
})