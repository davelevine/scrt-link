import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Paper, Button, Chip, Backdrop, Typography } from '@material-ui/core'
import { CloudUpload } from '@material-ui/icons'
import { useTranslation } from 'next-i18next'
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles'

import { Error } from '@/components/Error'
import { MB } from '@/constants'
import usePrettyBytes from '@/hooks/usePrettyBytes'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    paper: {
      borderStyle: 'dashed',
      borderWidth: '2px',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(5),
      color: theme.palette.text.secondary,
      height: '100%',
      flexDirection: 'column',
      textAlign: 'center',
      marginBottom: '1em',
    },
    dropInfo: {
      marginTop: ' .3em',
    },
    maxFileSizeInfo: {
      opacity: 0.5,
      fontSize: '.8em',
      position: 'absolute',
      right: '5px',
      bottom: '5px',
    },
  }),
)

interface DropZoneProps {
  onChange(file: File | null): void
  maxFileSize?: number
}
const DropZone: React.FC<DropZoneProps> = ({ onChange, maxFileSize = 10 * MB }) => {
  const classes = useStyles()
  const { t } = useTranslation('components')
  const prettyBytes = usePrettyBytes()

  const [error, setError] = useState(null)
  const [file, setFile] = useState<File | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      handleFilesInput(acceptedFiles)
    },
    noClick: true,
    noKeyboard: true,
    disabled: false,
  })

  const handleFilesInput = (files: File[] | FileList) => {
    setError(null)

    // Custom error handling
    if (!files.length) {
      setError(t('components.DropZone.error.noFiles', 'No file selected. Please try another file.'))
      return
    }

    // We only allow one file for now.
    if (files.length > 1) {
      setError(
        t(
          'components.DropZone.error.tooManyFiles',
          'Too many files. Only one file allowed at this point. You may compress multiple files into one zip file before uploading.',
        ),
      )
      return
    }
    const file = files[0]

    setFile(file)

    if (file.size > maxFileSize) {
      setError(
        t('components.DropZone.error.fileToLarge', {
          defaultValue: 'File too large. Maximum file size is {{max}}.',
          max: prettyBytes(maxFileSize),
        }),
      )
      return
    }

    onChange(file)
  }

  return (
    <div {...getRootProps()}>
      <Backdrop open={isDragActive} style={{ zIndex: 100 }}>
        <Typography variant="h2" gutterBottom style={{ color: '#fff', textAlign: 'center' }}>
          {t('components.DropZone.backdrop', `Drop It Like It's Hot`)}
        </Typography>
      </Backdrop>
      <Paper elevation={0} variant="outlined" className={classes.paper}>
        {file && (
          <Chip
            color="default"
            label={`${file.name} - ${prettyBytes(file.size)}`}
            onDelete={() => {
              setFile(null)
              setError(null)
              onChange(null)
            }}
          />
        )}
        {(error || !file) && (
          <>
            <input
              {...getInputProps()}
              id="file-input"
              type="file"
              onChange={(e) => {
                if (e.target.files) {
                  handleFilesInput(e.target.files)
                }
              }}
            />
            <label htmlFor="file-input">
              <Button
                component="span"
                size="large"
                color="primary"
                variant="contained"
                startIcon={<CloudUpload />}
              >
                {t('components.DropZone.button', 'Select file')}
              </Button>
            </label>
            <Typography className={classes.dropInfo} variant="body2">
              {t('components.DropZone.dragAndDrop', '…or drag & drop here.')}
            </Typography>
            <Typography className={classes.maxFileSizeInfo} variant="body2">
              {t('components.DropZone.maxFileSize', {
                defaultValue: `Max. {{maxSize}}`,
                maxSize: prettyBytes(maxFileSize),
              })}
            </Typography>
          </>
        )}
      </Paper>
      {error && <Error error={error} />}
    </div>
  )
}

export default DropZone
