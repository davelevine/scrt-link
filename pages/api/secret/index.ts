import { NextApiHandler, NextApiRequest } from 'next'
import * as Yup from 'yup'
import { pick } from 'ramda'

import { getSession } from 'next-auth/client'
import Pusher from 'pusher'

import withDb from '@/api/middlewares/withDb'
import handleErrors from '@/api/middlewares/handleErrors'
import createError from '@/api/utils/createError'
import { apiValidationSchemaByType } from '@/utils/validationSchemas'
import mailjet, { mailjetSms } from '@/api/utils/mailjet'
import { pusherCluster } from '@/constants'
import { encryptAES, decryptAES } from '@/utils/db'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: pusherCluster,
  useTLS: true,
})

const getInputValidationSchema = Yup.object().shape({
  alias: Yup.string().label('Alias').required().trim(),
})

const extractGetInput = async (req: NextApiRequest) => {
  try {
    await getInputValidationSchema.validate(req.query)
  } catch (err) {
    throw createError(422, err.message)
  }
  const { alias } = req.query
  if (typeof alias !== 'string') {
    throw createError(422, 'Invalid URL')
  }
  return alias
}

const extractPostInput = async (req: NextApiRequest) => {
  try {
    await apiValidationSchemaByType.validate(req.body) // Improve
  } catch (err) {
    throw createError(422, err.message)
  }

  return req.body
}

const handler: NextApiHandler = async (req, res) => {
  const models = req.models
  const session = await getSession({ req })

  if (!models) {
    throw createError(500, 'Could not find db connection')
  }

  switch (req.method) {
    case 'GET': {
      const alias = await extractGetInput(req)
      const secretUrlRaw = await models.SecretUrl.findOneAndDelete({ alias })
      if (!secretUrlRaw) {
        throw createError(
          404,
          `URL not found - This usually means the secret link has already been visited and therefore no longer exists.`,
        )
      }

      const secretUrl = secretUrlRaw.toJSON()

      const {
        secretType,
        isEncryptedWithUserPassword,
        neogramDestructionMessage,
        neogramDestructionTimeout,
        receiptEmail,
        receiptPhoneNumber,
        message,
      } = secretUrl

      // Update global stats
      models.Stats.findOneAndUpdate(
        {},
        {
          $inc: {
            totalSecretsViewCount: 1,
            'secretsViewCount.text': Number(secretType === 'text'),
            'secretsViewCount.url': Number(secretType === 'url'),
            'secretsViewCount.neogram': Number(secretType === 'neogram'),
          },
        },
        { new: true },
      )

      if (receiptPhoneNumber) {
        mailjetSms({
          To: `+${decryptAES(receiptPhoneNumber)}`,
          Text: `Your secret ${alias} has been viewed!🔥 Reply with a secret: https://scrt.link`,
        })
      }

      if (receiptEmail) {
        mailjet({
          To: [{ Email: decryptAES(receiptEmail), Name: 'Scrt.link' }],
          Subject: 'Secret has been viewed 🔥',
          TemplateID: 2818166,
          TemplateLanguage: true,
          Variables: {
            alias,
          },
        })
      }

      res.json({
        secretType,
        message: decryptAES(message),
        neogramDestructionMessage: neogramDestructionMessage
          ? decryptAES(neogramDestructionMessage)
          : '',
        isEncryptedWithUserPassword,
        neogramDestructionTimeout,
      })
      break
    }
    case 'POST': {
      const {
        secretType,
        message,
        isEncryptedWithUserPassword,
        alias,
        receiptEmail,
        receiptPhoneNumber,
        neogramDestructionMessage,
        neogramDestructionTimeout,
      } = await extractPostInput(req)

      // Stats
      const stats = await models.Stats.findOneAndUpdate(
        {},
        {
          $inc: {
            totalSecretsCount: 1,
            'secretsCount.text': Number(secretType === 'text'),
            'secretsCount.url': Number(secretType === 'url'),
            'secretsCount.neogram': Number(secretType === 'neogram'),
          },
        },
        { new: true, upsert: true },
      )

      pusher.trigger(
        'stats',
        'stats-update',
        pick(['totalSecretsCount', 'secretsCount', 'totalSecretsViewCount'])(stats.toJSON()),
      )

      if (session?.userId) {
        await models.Stats.findOneAndUpdate(
          { userId: session.userId },
          {
            $inc: {
              totalSecretsCount: 1,
              'secretsCount.text': Number(secretType === 'text'),
              'secretsCount.url': Number(secretType === 'url'),
              'secretsCount.neogram': Number(secretType === 'neogram'),
            },
          },
          { new: true, upsert: true },
        )
      }

      const shortened = new models.SecretUrl({
        secretType,
        message: encryptAES(message),
        alias,
        neogramDestructionMessage: encryptAES(neogramDestructionMessage),
        neogramDestructionTimeout,
        isEncryptedWithUserPassword,
        ...(receiptEmail ? { receiptEmail: encryptAES(receiptEmail) } : {}),
        ...(receiptPhoneNumber ? { receiptPhoneNumber: encryptAES(receiptPhoneNumber) } : {}),
      })

      await shortened.save()

      res.status(200).json({ alias, message: 'Secret saved!' })
      break
    }
    default:
      throw createError(405, 'Method Not Allowed')
  }
}

export default handleErrors(withDb(handler))