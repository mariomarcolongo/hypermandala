from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'public' / 'immersive.js'
text = path.read_text()


def once(old, new, label):
    global text
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected 1 anchor, got {count}')
    text = text.replace(old, new, 1)

once(
    "    xrMenuDirty: true,\n    xrHoldAction: null,",
    "    xrMenuDirty: true,\n    xrMenuTextureDirty: true,\n    xrHoldAction: null,",
    'menu texture state',
)
once(
    "    perception.xrMenuCtx = menuCtx;\n    perception.xrMenuDirty = true;\n  }",
    "    perception.xrMenuCtx = menuCtx;\n    perception.xrMenuDirty = true;\n    perception.xrMenuTextureDirty = true;\n  }",
    'menu texture init',
)
once(
    "    perception.xrMenuDirty = false;\n  }\n\n  function placeXRMenuFromPose",
    "    perception.xrMenuDirty = false;\n    perception.xrMenuTextureDirty = true;\n  }\n\n  function placeXRMenuFromPose",
    'menu paint texture flag',
)
once(
    "    gl.bindTexture(gl.TEXTURE_2D, perception.xrUiTexture);\n    if (perception.xrMenuDirty) paintXRMenu();\n    if (perception.xrMenuCanvas) {\n      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);\n      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, perception.xrMenuCanvas);\n      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);\n    }",
    "    gl.bindTexture(gl.TEXTURE_2D, perception.xrUiTexture);\n    if (perception.xrMenuTextureDirty && perception.xrMenuCanvas) {\n      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);\n      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, perception.xrMenuCanvas);\n      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);\n      perception.xrMenuTextureDirty = false;\n    }",
    'menu texture upload cache',
)

path.write_text(text)
print('VR menu texture upload caching applied.')
