import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import styled from 'styled-components'
import clsx from 'clsx'
import { throttle } from 'throttle-debounce'
import { Box, Divider } from '@material-ui/core'
import { usePlausible } from 'next-plausible'
import { useSession } from 'next-auth/client'

import { Link } from '@/components/Link'
import BaseButton from '@/components/BaseButton'
import SROnly from '@/components/ScreenreaderOnly'
import { menu } from '@/data/menu'

const Hamburger = styled.button`
  -webkit-appearance: none;
  background-color: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  font: inherit;
  -webkit-font-smoothing: inherit;
  -moz-osx-font-smoothing: inherit;
  line-height: inherit;
  margin: 0;
  max-width: 100%;
  overflow: visible;
  padding: 0;
  text-align: inherit;
  text-rendering: inherit;
  vertical-align: inherit;

  margin-left: 1rem;
  position: relative;
  height: 30px;
  transition: opacity 0.32s 0.4s;
  width: 40px;
  z-index: 300;

  &::before,
  &::after {
    background-color: currentColor;
    content: '';
    height: 2px;
    left: 20%;
    margin-top: -1px;
    position: absolute;
    top: 50%;
    transition: 0.29s cubic-bezier(0.52, 0.01, 0.16, 1);
    width: 60%;
  }

  &::before {
    transform: rotate(0deg) translateY(-5px);
  }

  &::after {
    transform: rotate(0deg) translateY(5px);
  }

  &.Hamburger--active {
    &::before {
      transform: rotate(45deg) translateY(0);
    }
    &::after {
      transform: rotate(-45deg) translateY(0);
    }
    &::before,
    &::after {
      background-color: currentColor;
    }
  }
`
const NavigationInner = styled.div`
  align-items: center;
  background-color: ${({ theme }) => theme.palette.background.paper};
  border: 5px solid ${({ theme }) => theme.palette.primary.main};
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  left: 0;
  opacity: 0;
  pointer-events: none;
  position: fixed;
  top: 0;
  transition: 0.55s cubic-bezier(0.52, 0.01, 0.16, 1);
  width: 100%;
  z-index: 110;

  &.Navigation--active {
    opacity: 1;
    pointer-events: auto;
  }
`

const Nav = styled.nav`
  align-items: center;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;

  ul {
    list-style-type: none;
    margin: 0;
    padding: 2em 0;
    text-align: center;
  }

  a {
    display: block;
    font-size: clamp(1.6rem, 5vw, 2rem);
    color: ${({ theme }) => theme.palette.text.primary};
    padding: 0.15em 1em;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }

    &.Nav--active {
      color: ${({ theme }) => theme.palette.primary.main};
    }
  }
`

const NavigationWrapper = styled.div`
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  overflow-y: scroll;
  width: 100%;
`

const NavigationMenu: React.FunctionComponent = () => {
  const router = useRouter()
  const [session] = useSession()

  return (
    <Nav role="navigation" id="navigation" aria-label="Main navigation menu">
      <ul>
        {menu.map(({ href, label }, index) => (
          <li key={index}>
            <Link
              href={href}
              key={index}
              className={clsx({ 'Nav--active': router.pathname === href })}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <Box>
        <Divider />
        <Box pt={2}>
          {session ? (
            <Link href="/account">Account</Link>
          ) : (
            <Link href="/account?signup=true">Get Account</Link>
          )}
        </Box>
      </Box>
    </Nav>
  )
}

const Navigation = () => {
  const router = useRouter()
  const [isActive, setIsActive] = useState(false)
  const plausible = usePlausible()

  const showNavigation = () => {
    setIsActive(true)
    const scrollY = document.documentElement.style.getPropertyValue('--scroll-y')
    const body = document.body
    body.style.position = 'fixed'
    body.style.width = '100%'
    body.style.top = `-${scrollY}`
    plausible('Open Navigation')
  }

  const closeNavigation = () => {
    const body = document.body
    const scrollY = body.style.top
    body.style.position = ''
    body.style.top = ''
    window.scrollTo(0, parseInt(scrollY || '0') * -1)
    setIsActive(false)
  }

  const scrollHandler = throttle(100, () => {
    document.documentElement.style.setProperty('--scroll-y', `${window.scrollY}px`)
  })

  useEffect(() => {
    window.addEventListener('scroll', scrollHandler)

    router.events.on('routeChangeStart', () => {
      closeNavigation()
    })

    return () => {
      window.removeEventListener('scroll', scrollHandler)
    }
  }, [])

  return (
    <div>
      <NavigationInner
        className={clsx({
          'Navigation--active': isActive,
        })}
      >
        <NavigationWrapper>
          <NavigationMenu />
        </NavigationWrapper>
        <Box p={1}>
          <BaseButton color="primary" onClick={closeNavigation}>
            Close
          </BaseButton>
        </Box>
      </NavigationInner>
      <Hamburger
        aria-label={isActive ? 'Close menu' : 'Open menu'}
        aria-controls="navigation"
        onClick={isActive ? closeNavigation : showNavigation}
        className={clsx({
          'Hamburger--active': isActive,
        })}
      >
        <SROnly>{isActive ? 'Close menu' : 'Open menu'}</SROnly>
      </Hamburger>
    </div>
  )
}

export default Navigation