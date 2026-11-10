"""Generate js/dark-fantasy-offline.js so file:// opens load all 43 Dark Fantasy GLBs without CORS."""
import base64
import glob
import json
import os


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    glb_paths = sorted(glob.glob(os.path.join(root, 'game-art', 'dark-fantasy', '*.glb')))
    out_path = os.path.join(root, 'js', 'dark-fantasy-offline.js')

    bundle = {}
    for path in glb_paths:
        name = os.path.splitext(os.path.basename(path))[0]
        with open(path, 'rb') as f:
            bundle[name] = base64.b64encode(f.read()).decode('ascii')

    with open(out_path, 'w', encoding='utf-8', newline='\n') as out:
        out.write('// Auto-generated offline GLB bundle for file:// protocol usage.\n')
        out.write('window.DARK_FANTASY_OFFLINE_GLB = ')
        json.dump(bundle, out, separators=(',', ':'))
        out.write(';\n')

    size_mb = os.path.getsize(out_path) / (1024 * 1024)
    print(f'Wrote {len(bundle)} models to {out_path} ({size_mb:.2f} MB)')


if __name__ == '__main__':
    main()

