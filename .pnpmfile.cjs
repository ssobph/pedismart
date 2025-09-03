module.exports = {
  hooks: {
    readPackage
  }
}

function readPackage(pkg, context) {
  if (pkg.name && pkg.name.startsWith('@expo/')) {
    if (!pkg.dependencies) pkg.dependencies = {}
    if (!pkg.dependencies.expo) {
      pkg.dependencies.expo = pkg.peerDependencies?.expo || '^53.0.0'
    }
  }

  if (pkg.name === '@expo/metro-runtime') {
    if (!pkg.dependencies) pkg.dependencies = {}
    if (!pkg.dependencies.expo) {
      pkg.dependencies.expo = '^53.0.0'
    }
  }

  return pkg
}
