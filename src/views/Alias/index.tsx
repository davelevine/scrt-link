import React, { useCallback, useState } from 'react'
import { NextPage } from 'next'
import axios from 'axios'
import { Box, CircularProgress, Typography } from '@material-ui/core'
import { Alert } from '@material-ui/lab'
import { Formik, Form, FormikConfig } from 'formik'
import { AES, enc } from 'crypto-js'
import { parse } from 'uri-js'
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles'
import ReplyIcon from '@material-ui/icons/Reply'
import { usePlausible } from 'next-plausible'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import FileCopyOutlinedIcon from '@material-ui/icons/FileCopyOutlined'
import Paper from '@material-ui/core/Paper'
import clsx from 'clsx'

import Windups from '@/components/Windups'
import { passwordValidationSchema } from '@/utils/validationSchemas'
import { SecretType } from '@/types'
import { isServer } from '@/utils'
import BasePasswordField from '@/components/BasePasswordField'
import BaseButton from '@/components/BaseButton'
import Page from '@/components/Page'

// https://stackoverflow.com/a/19709846
const isAbsoluteUrl = (url: string) => {
  if (url.startsWith('//')) {
    return true
  }

  const uri = parse(url)
  return !!uri.scheme
}

type OnSubmit<FormValues> = FormikConfig<FormValues>['onSubmit']

interface AliasViewProps {
  error?: string
  message?: string
  isEncryptedWithUserPassword?: boolean
  secretType?: SecretType
}
interface PasswordForm {
  password: string
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    break: {
      wordBreak: 'break-word',
    },
    message: {
      fontSize: '1.1rem',
    },
  }),
)

const AliasView: NextPage<AliasViewProps> = ({
  error,
  message = '',
  isEncryptedWithUserPassword = false,
  secretType,
}) => {
  const classes = useStyles()
  const plausible = usePlausible()

  const [hasCopied, setHasCopied] = useState(false)
  const [localMessage, setLocalMessage] = useState(message)
  const [success, setSuccess] = useState(false)

  const initialValues: PasswordForm = {
    password: '',
  }

  const pageRedirect = (url: string) => {
    if (!isServer()) {
      if (!isAbsoluteUrl(url)) {
        url = `http://${url}`
      }

      window.location.replace(url)
    }
  }

  // If URL is in plain text, redirect early
  if (!isEncryptedWithUserPassword && secretType === 'url') {
    pageRedirect(message)
  }

  const handleSubmit = useCallback<OnSubmit<PasswordForm>>(async (values, formikHelpers) => {
    try {
      const bytes = AES.decrypt(message, values.password)

      const result = bytes.toString(enc.Utf8)
      if (!result) {
        throw new Error('Wrong Password')
      } else {
        setSuccess(true)
        setLocalMessage(result)

        if (secretType === 'url') {
          pageRedirect(result)
        }
      }

      formikHelpers.resetForm()
    } catch (error) {
      formikHelpers.setErrors({ password: 'Wrong Password' })
    } finally {
      formikHelpers.setSubmitting(false)
    }
  }, [])

  if (!message && !error) {
    return (
      <Box display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    )
  }

  const needsPassword = isEncryptedWithUserPassword && !success

  const pageSubTitle = needsPassword ? 'Enter password to descypt your secret:' : ''
  return (
    <>
      <Page title="Your secret:" subtitle={pageSubTitle} noindex>
        {!needsPassword && localMessage && (
          <Box mb={3}>
            {secretType === 'neogram' ? (
              <Typography variant="subtitle1" className={classes.break}>
                <Windups message={localMessage} />
              </Typography>
            ) : (
              <Paper elevation={3} className={clsx(classes.break, classes.message)}>
                <Box px={4} pt={4} pb={2}>
                  {localMessage}
                  <Box pt={2} display="flex" justifyContent="flex-end">
                    <Box mr={2}>
                      <BaseButton variant="text" color="primary" size="small" href="/">
                        Destroy secret
                      </BaseButton>
                    </Box>
                    <CopyToClipboard
                      text={localMessage}
                      onCopy={() => {
                        setHasCopied(true)
                        setTimeout(() => {
                          setHasCopied(false)
                        }, 2000)
                      }}
                    >
                      <BaseButton
                        startIcon={<FileCopyOutlinedIcon />}
                        variant="contained"
                        color="primary"
                        size="small"
                      >
                        {hasCopied ? 'Copied' : 'Copy'}
                      </BaseButton>
                    </CopyToClipboard>
                  </Box>
                </Box>
              </Paper>
            )}

            <Box mt={3}>
              <BaseButton
                href="/"
                color="primary"
                variant="contained"
                size="large"
                startIcon={<ReplyIcon />}
                onClick={() => plausible('ReplyButton')}
              >
                Reply with a secret
              </BaseButton>
            </Box>
          </Box>
        )}

        {isEncryptedWithUserPassword && !success && (
          <Formik<PasswordForm>
            initialValues={initialValues}
            validationSchema={passwordValidationSchema}
            validateOnMount
            onSubmit={handleSubmit}
          >
            {({ isValid, isSubmitting }) => {
              return (
                <>
                  <Form noValidate>
                    <Box mb={2}>
                      <BasePasswordField required name="password" />
                    </Box>
                    <Box mb={1}>
                      <BaseButton
                        type="submit"
                        color="primary"
                        variant="contained"
                        size="large"
                        loading={isSubmitting}
                        disabled={!isValid}
                      >
                        Decrypt Message
                      </BaseButton>
                    </Box>
                  </Form>
                </>
              )
            }}
          </Formik>
        )}

        {error && <Alert severity="error">{error}</Alert>}
      </Page>
    </>
  )
}

// Tried this with "getServerSideProps" too.
// When the user directly opens this page, there are no problems.
// But when user redirects to this page from another page in the app,
// some CORS error is happening while redirecting the request.
// "getServerSideProps" runs twice and in the end we increase "clicks"
// twice. So, we are using "getInitialProps" for a while.
AliasView.getInitialProps = async ({ res, query }) => {
  const { alias } = query

  let error
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/shorturl?alias=${alias}`,
    )
    const { data } = response
    const { secretType, message, isEncryptedWithUserPassword } = data

    return { secretType, message: decodeURIComponent(message), isEncryptedWithUserPassword }
  } catch (err) {
    const { response } = err
    if (response) {
      const { data } = response
      error = `${data.statusCode}: ${data.message}`
    } else {
      error = 'An unknown error occured'
    }
    return { error }
  }
  return {}
}

export default AliasView
