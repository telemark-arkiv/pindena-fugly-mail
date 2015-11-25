'use strict'

var jsonfile = require('jsonfile')
var Gmail = require('node-gmail-api')
var gmail = new Gmail('<GMAIL-KEY>')
var s = gmail.messages('label:inbox', {max: 10})
var sendgrid = require('sendgrid')('<SENDGRID-KEY>')
var email = new sendgrid.Email()

var file = 'mailIds.json'
var skipIdsFile = jsonfile.readFileSync(file)

function checkMails (callback) {
  s.on('data', function (d) {
    if (d.id) {
      skipIds(d.id, function (skip) {
        if (skip === true) {
          console.log('skip: ' + d.id)
        } else {
          sendThis(d)
        }
      })
    }
  })

  s.on('end', function (d) {
    writeIds(skipIdsFile)
    return callback()
  })
}

function sendThis (mail) {
  console.log('sending mail:' + mail.id)
  mail.payload.headers.forEach(function (entry) {
    switch (entry.name) {
      case 'From':
        email.addTo(entry.value)
        break
      case 'To':
        email.setFrom(entry.value)
        break
      case 'Subject':
        email.setSubject(entry.value)
        break
    }
  })
  email.setHtml(mail.snippet)
  sendgrid.send(email)
  skipIdsFile.push(mail.id)
}

function skipIds (id, callback) {
  var res = false
  skipIdsFile.forEach(function (entry) {
    if (entry === id) {
      res = true
    }
  })
  return callback(res)
}

function writeIds (ids) {
  jsonfile.writeFileSync(file, ids)
}

module.exports = checkMails
