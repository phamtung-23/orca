import React from 'react'

// Material Icon Theme (MIT, https://github.com/material-extensions/vscode-material-icon-theme)
// The same file/folder icon set as the VS Code extension, read from its npm package.

type IconMap = Record<string, string>
type Manifest = {
  iconDefinitions: Record<string, { iconPath: string }>
  file: string
  folder: string
  folderExpanded: string
  fileNames: IconMap
  fileExtensions: IconMap
  folderNames: IconMap
  folderNamesExpanded: IconMap
}

const manifestModules = import.meta.glob(
  '../../../../node_modules/material-icon-theme/dist/material-icons.json',
  { eager: true, import: 'default' }
) as Record<string, Manifest>

// Why: ?no-inline emits each SVG as its own asset file, so the ~1,250 icons do not
// get base64-inlined into the renderer JS bundle.
const svgModules = import.meta.glob('../../../../node_modules/material-icon-theme/icons/*.svg', {
  eager: true,
  query: '?no-inline',
  import: 'default'
}) as Record<string, string>

const manifest: Manifest | undefined = Object.values(manifestModules)[0]

const urlBySvgName: IconMap = {}
for (const [path, url] of Object.entries(svgModules)) {
  urlBySvgName[path.slice(path.lastIndexOf('/') + 1)] = url
}

function iconUrl(iconId: string | undefined): string | undefined {
  if (!manifest || !iconId) {
    return undefined
  }
  const iconPath = manifest.iconDefinitions[iconId]?.iconPath
  if (!iconPath) {
    return undefined
  }
  return urlBySvgName[iconPath.slice(iconPath.lastIndexOf('/') + 1)]
}

function baseName(pathOrName: string): string {
  const lastSlash = Math.max(pathOrName.lastIndexOf('/'), pathOrName.lastIndexOf('\\'))
  return lastSlash >= 0 ? pathOrName.slice(lastSlash + 1) : pathOrName
}

export function getMaterialFileIconUrl(pathOrName: string): string | undefined {
  if (!manifest) {
    return undefined
  }
  const lower = baseName(pathOrName).toLowerCase()
  const byName = manifest.fileNames[lower]
  if (byName) {
    return iconUrl(byName)
  }
  // Longest extension first: "app.test.ts" tries "test.ts", then "ts".
  const parts = lower.split('.')
  for (let i = 1; i < parts.length; i++) {
    const byExt = manifest.fileExtensions[parts.slice(i).join('.')]
    if (byExt) {
      return iconUrl(byExt)
    }
  }
  return iconUrl(manifest.file)
}

export function getMaterialFolderIconUrl(pathOrName: string, open: boolean): string | undefined {
  if (!manifest) {
    return undefined
  }
  const lower = baseName(pathOrName).toLowerCase()
  const id = open
    ? (manifest.folderNamesExpanded[lower] ?? manifest.folderExpanded)
    : (manifest.folderNames[lower] ?? manifest.folder)
  return iconUrl(id)
}

type ImgIconProps = { url: string | undefined; className?: string; fallback: React.ReactNode }

function ImgIcon({ url, className, fallback }: ImgIconProps): React.JSX.Element {
  if (!url) {
    return <>{fallback}</>
  }
  return <img src={url} alt="" aria-hidden draggable={false} className={className} />
}

export function MaterialFileIcon({
  name,
  className,
  fallback
}: {
  name: string
  className?: string
  fallback: React.ReactNode
}): React.JSX.Element {
  return <ImgIcon url={getMaterialFileIconUrl(name)} className={className} fallback={fallback} />
}

export function MaterialFolderIcon({
  name,
  open,
  className,
  fallback
}: {
  name: string
  open: boolean
  className?: string
  fallback: React.ReactNode
}): React.JSX.Element {
  return (
    <ImgIcon url={getMaterialFolderIconUrl(name, open)} className={className} fallback={fallback} />
  )
}
