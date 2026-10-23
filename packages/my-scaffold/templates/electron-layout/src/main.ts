import './style.css'

const version = document.querySelector<HTMLParagraphElement>('#version')
if (!version) throw new Error('Missing version element')

window.desktop
  .getVersion()
  .then((value) => {
    version.textContent = `Version ${value}`
  })
  .catch((error: unknown) => {
    version.textContent = 'Could not load the app version.'
    console.error(error)
  })
