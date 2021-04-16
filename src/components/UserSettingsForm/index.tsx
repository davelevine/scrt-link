import React, { useCallback, useReducer } from 'react'
import axios from 'axios'
import { Box, Typography } from '@material-ui/core'
import { Formik, Form, FormikConfig } from 'formik'

import { makeStyles, Theme, createStyles } from '@material-ui/core/styles'

import Alert from '@material-ui/lab/Alert'

import BaseTextField from '@/components/BaseTextField'
import BaseSwitch from '@/components/BaseSwitch'
import { Maybe, UserSettings, SignIn } from '@/types'

import BaseButton from '@/components/BaseButton'
import { userSettingsValidationSchema } from '@/utils/validationSchemas'
import { doRequest, doSuccess, doError, createReducer } from '@/utils/axios'

type OnSubmit<FormValues> = FormikConfig<FormValues>['onSubmit']

interface State {
  data: Maybe<{ message: string }>
  error: Maybe<string>
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    submitButton: {
      width: '100%',
    },
  }),
)

const initialState: State = {
  data: undefined,
  error: undefined,
}

const reducer = createReducer<State>()

interface UserSettingsFormProps extends SignIn, UserSettings {
  onSuccess: () => void
}
const UserSettingsForm = ({
  name,
  neogramDestructionMessage,
  email,
  isReadReceiptsEnabled,
  onSuccess,
}: UserSettingsFormProps) => {
  const classes = useStyles()
  const [state, dispatch] = useReducer(reducer, initialState)

  const initialValues: UserSettings & SignIn = {
    name: name || '',
    neogramDestructionMessage: neogramDestructionMessage || '',
    email,
    isReadReceiptsEnabled,
  }

  const handleSubmit = useCallback<OnSubmit<UserSettings>>(async (values, formikHelpers) => {
    dispatch(doRequest())

    try {
      const response = await axios.post('/api/me', values)
      dispatch(doSuccess(response))
      onSuccess()
    } catch (error) {
      dispatch(doError(error))
    } finally {
      formikHelpers.setSubmitting(false)
    }
  }, [])

  const { data, error } = state

  return (
    <>
      {error ||
        (data && (
          <Box mb={5}>
            {error && <Alert severity="error">{error}</Alert>}
            {data && <Alert severity="success">{data.message}</Alert>}
          </Box>
        ))}

      <Formik<UserSettings>
        initialValues={initialValues}
        enableReinitialize={true}
        validationSchema={userSettingsValidationSchema}
        validateOnMount
        onSubmit={handleSubmit}
      >
        {({ isValid, isSubmitting }) => {
          return (
            <>
              <Form noValidate>
                <Box mb={5}>
                  <Box mb={3}>
                    <BaseTextField name="name" label="Name" />
                  </Box>
                  <Box mb={1}>
                    <BaseTextField name="email" label="Email" value={email} disabled />
                  </Box>
                  {/* <Box mb={2}>
                    <BaseSwitch label="Get read receipts" name="isReadReceiptsEnabled" />
                  </Box> */}
                </Box>
                <Box mb={5}>
                  <Typography variant="h3">Neogram™</Typography>
                  <BaseTextField
                    name="neogramDestructionMessage"
                    label="Destruction message"
                    placeholder="This message will self-destruct in five seconds!"
                  />
                </Box>
                <Box mb={1}>
                  <BaseButton
                    className={classes.submitButton}
                    type="submit"
                    color="primary"
                    variant="contained"
                    size="large"
                    loading={isSubmitting}
                    disabled={!isValid}
                  >
                    Save
                  </BaseButton>
                </Box>
              </Form>
            </>
          )
        }}
      </Formik>
    </>
  )
}

export default UserSettingsForm
