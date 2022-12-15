
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
      name: "@electron-forge/maker-zip",
      config: {
        options: {
          icon: "icon.png"
        }
      },
      platforms: [
        "darwin"
      ],
      arch: [
        "x64",
      ],
    },
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "sfc-gh-zblackwood",
          name: "streamlit-desktop"
        },
        platforms: [
          "darwin"
        ],
        arch: [
          "x64",
        ],
        prerelease: true,
        draft: false,
      }
    }
  ]
}