
module.exports = {
  packagerConfig: {
    icon: "icon",
    extraResource: [
      "./python/"
    ],
    // COMMENT OUT THESE TWO ENTRIES IF YOU WANT TO TEST A RELEASE BUILD LOCALLY
    osxSign: {},
    osxNotarize: {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    },
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel"
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: [
        "darwin"
      ],
      arch: [
        "x64"
      ]
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          icon: "icon.png"
        }
      },
      platforms: [
        "linux"
      ]
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {}
    }
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "sfc-gh-zblackwood",
          name: "streamlit-desktop"
        },
        prerelease: true,
        draft: false,
      }
    }
  ]
}