import { Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { Typeset } from '@storybook/addon-docs/blocks'

import { brandColors } from '../src/tokens'
import { fontFamily, fontWeightBold, fontWeightRegular, headingsFontFamily } from '../src/typography'

import { variantsDefinition } from './font-variants'

const headingText = 'Typography text'
const bodyText =
  'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Sed vel lectus. Donec odio tempus molestie, porttitor ut, iaculis quis, sem.'

const fontSizeToPx = (fontSize: number) => `${fontSize}px`

const headings = [variantsDefinition.h1, variantsDefinition.h2, variantsDefinition.h3, variantsDefinition.h4]

const texts = [variantsDefinition.S, variantsDefinition.M, variantsDefinition.L, variantsDefinition.XL]
const textColor = brandColors.bodyText.primary

export const Headings = () =>
  headings.map((variant) => (
    <Stack key={variant.variant} sx={{ color: textColor, mb: 2 }}>
      <Typography color="bodyText.contrast" sx={{ fontWeight: '600' }} variant="S">
        {variant.variant}
      </Typography>
      <Typeset
        fontFamily={headingsFontFamily}
        fontSizes={[fontSizeToPx(variant.fontSize)]}
        fontWeight={fontWeightBold}
        sampleText={headingText}
      />
    </Stack>
  ))

export const BodyText = () =>
  texts.map((variant) => (
    <Stack key={variant.variant} sx={{ color: textColor, mb: 2 }}>
      <Typography color="bodyText.contrast" sx={{ fontWeight: 'fontWeightBold' }} variant="S">
        {variant.variant}
      </Typography>
      <Typeset
        fontFamily={fontFamily}
        fontSizes={[fontSizeToPx(variant.fontSize)]}
        fontWeight={fontWeightRegular}
        sampleText={bodyText}
      />
    </Stack>
  ))
