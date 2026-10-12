#!/usr/bin/env python3
# Copyright (c) 2026-present Antimatter contributors. All Rights Reserved.
# See LICENSE.txt for license information.

"""
Renders the app icons and the splash screen images of the mobile app from the Antimatter mark
(assets/brand/mark.svg, and mark-dark.svg for dark backgrounds):

- iOS: the AppIcon set and the launch screen images (SplashIcon, SplashBackground, light and dark);
- Android: the launcher icons (adaptive foreground and background, legacy square and round), the
  notification small icon (white on transparent) and the splash images (light and night);
- the in-app images (assets/base/images/icon.png and logo.png).

Each image is written both to the native project (used by development builds) and to
assets/base/release (copied over by fastlane for store builds).

Requires rsvg-convert (librsvg) and ImageMagick 7 (`magick`). Run from the repository root:

    python3 scripts/generate-brand-assets.py
"""

import os
import re
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = os.path.join(ROOT, 'assets', 'brand')
RELEASE = os.path.join(ROOT, 'assets', 'base', 'release')
ANDROID_RES = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')
IOS_ASSETS = os.path.join(ROOT, 'ios', 'Mattermost', 'Images.xcassets')

# Colours of antimatter.chat
BG_TOP = '#241A4D'
BG_BOTTOM = '#140E2C'
SPLASH_LIGHT = '#FFFFFF'
SPLASH_DARK = '#1B1A24'
GLOW_LIGHT = '#EDE9FE'
GLOW_DARK = '#2A1F5C'

DENSITIES = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}

# The single-colour mark used for the notification icon: thicker orbits, no hollow electron, so that it
# reads at 24dp.
MONO_MARK = '''<g fill="none" stroke="{color}" stroke-width="5">
    <ellipse cx="32" cy="32" rx="26" ry="10" transform="rotate(45 32 32)"/>
    <ellipse cx="32" cy="32" rx="26" ry="10" transform="rotate(-45 32 32)"/>
  </g>
  <path d="M32 22.5Q33.6 30.4 41.5 32Q33.6 33.6 32 41.5Q30.4 33.6 22.5 32Q30.4 30.4 32 22.5Z" fill="{color}"/>
  <circle cx="13.6" cy="13.6" r="6" fill="{color}"/>
  <circle cx="50.4" cy="13.6" r="5" fill="{color}"/>'''


def mark_body(dark=False):
    """The inner elements of the mark (64x64 user units)."""
    with open(os.path.join(BRAND, 'mark-dark.svg' if dark else 'mark.svg')) as f:
        svg = f.read()
    return re.search(r'<svg[^>]*>(.*)</svg>', svg, re.S).group(1)


def icon_svg(size_units=1024, mark_scale=12, rounded=False, circle=False):
    """The app icon: the dark-background mark on the night gradient."""
    shape = f'<rect width="{size_units}" height="{size_units}" fill="url(#bg)"/>'
    if rounded:
        r = size_units * 0.2237
        shape = f'<rect width="{size_units}" height="{size_units}" rx="{r}" fill="url(#bg)"/>'
    if circle:
        c = size_units / 2
        shape = f'<circle cx="{c}" cy="{c}" r="{c}" fill="url(#bg)"/>'
    offset = (size_units - 64 * mark_scale) / 2
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size_units} {size_units}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{BG_TOP}"/>
      <stop offset="1" stop-color="{BG_BOTTOM}"/>
    </linearGradient>
  </defs>
  {shape}
  <g transform="translate({offset} {offset}) scale({mark_scale})">{mark_body(dark=True)}</g>
</svg>
'''


def adaptive_background_svg():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{BG_TOP}"/>
      <stop offset="1" stop-color="{BG_BOTTOM}"/>
    </linearGradient>
  </defs>
  <rect width="108" height="108" fill="url(#bg)"/>
</svg>
'''


def adaptive_foreground_svg():
    # 108dp canvas, 66dp safe circle: the mark reaches 30.5 units from its centre (the electrons), so a
    # 64dp mark stays inside the safe zone.
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">
  <g transform="translate(22 22)">{mark_body(dark=True)}</g>
</svg>
'''


def mark_svg(dark=False):
    """The mark alone, cropped to its extent (for the splash screen and the in-app logo)."""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 60 60">{mark_body(dark)}</svg>
'''


def notification_svg():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  {MONO_MARK.format(color='#FFFFFF')}
</svg>
'''


def glow_svg(base, glow):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="g" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="{glow}" stop-opacity="1"/>
      <stop offset="1" stop-color="{glow}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" fill="{base}"/>
  <rect width="100" height="100" fill="url(#g)"/>
</svg>
'''


def render(svg, out, width, height=None, opaque=False):
    height = height or width
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with tempfile.NamedTemporaryFile('w', suffix='.svg', delete=False) as f:
        f.write(svg)
        src = f.name
    try:
        subprocess.run(['rsvg-convert', '-w', str(width), '-h', str(height), '-o', out, src], check=True)
        args = ['magick', out]
        if opaque:
            args += ['-background', BG_BOTTOM, '-alpha', 'remove', '-alpha', 'off']
        args += ['-strip', out]
        subprocess.run(args, check=True)
    finally:
        os.unlink(src)


def both(rel_native, rel_release):
    """Paths of an image in the native project and in the release assets."""
    return [rel_native, rel_release]


def ios_icons():
    sizes = {
        '20.png': 20, '20@2x.png': 40, '20@3x.png': 60,
        '29.png': 29, '29@2x.png': 58, '29@3x.png': 87,
        '40.png': 40, '40@2x.png': 80, '40@3x.png': 120,
        '76.png': 76, '76@2x.png': 152, '83.5@2x.png': 167,
        'Icon-60@2x.png': 120, 'Icon-60@3x.png': 180,
        'iTunesArtwork@2x.png': 1024,
    }
    svg = icon_svg()
    for name, px in sizes.items():
        for out in both(os.path.join(IOS_ASSETS, 'AppIcon.appiconset', name),
                        os.path.join(RELEASE, 'icons', 'ios', name)):
            render(svg, out, px, opaque=True)


def ios_splash():
    for dark in (False, True):
        suffix = '_Dark' if dark else ''
        for scale in (1, 2, 3):
            name = f'SplashIcon{suffix}{"" if scale == 1 else f"@{scale}x"}.png'
            for out in both(os.path.join(IOS_ASSETS, 'SplashIcon.imageset', name),
                            os.path.join(RELEASE, 'splash_screen', 'ios', 'SplashIcon.imageset', name)):
                render(mark_svg(dark), out, 300 * scale)

        bg_suffix = 'Dark' if dark else ''
        svg = glow_svg(SPLASH_DARK if dark else SPLASH_LIGHT, GLOW_DARK if dark else GLOW_LIGHT)
        for scale in (1, 2, 3):
            name = f'SplashBackground{bg_suffix}{"" if scale == 1 else f"@{scale}x"}.png'
            for out in both(os.path.join(IOS_ASSETS, 'SplashBackground.imageset', name),
                            os.path.join(RELEASE, 'splash_screen', 'ios', 'SplashBackground.imageset', name)):
                render(svg, out, 896 * scale, opaque=True)


def android_icons():
    for density, factor in DENSITIES.items():
        folder = f'mipmap-{density}'
        outputs = {
            'ic_launcher.png': (icon_svg(rounded=True), round(48 * factor)),
            'ic_launcher_round.png': (icon_svg(circle=True), round(48 * factor)),
            'ic_launcher_background.png': (adaptive_background_svg(), round(108 * factor)),
            'ic_launcher_foreground.png': (adaptive_foreground_svg(), round(108 * factor)),
            'ic_notification.png': (notification_svg(), round(24 * factor)),
        }
        for name, (svg, px) in outputs.items():
            for out in both(os.path.join(ANDROID_RES, folder, name),
                            os.path.join(RELEASE, 'icons', 'android', folder, name)):
                render(svg, out, px)


def android_splash():
    # The splash bitmap is drawn at its natural size: 96dp, like the iOS launch screen.
    # The background is drawn with center|fill_vertical, and its size does not depend on the density.
    bg_sizes = {'mdpi': 896, 'hdpi': 1792, 'xhdpi': 2688, 'xxhdpi': 2688, 'xxxhdpi': 2688}
    for density, factor in DENSITIES.items():
        for night in (False, True):
            folder = f'drawable-night-{density}' if night else f'drawable-{density}'
            bg = glow_svg(SPLASH_DARK if night else SPLASH_LIGHT, GLOW_DARK if night else GLOW_LIGHT)
            for out in both(os.path.join(ANDROID_RES, folder, 'splash.png'),
                            os.path.join(RELEASE, 'splash_screen', 'android', folder, 'splash.png')):
                render(mark_svg(night), out, round(96 * factor))
            for out in both(os.path.join(ANDROID_RES, folder, 'splash_background.png'),
                            os.path.join(RELEASE, 'splash_screen', 'android', folder, 'splash_background.png')):
                render(bg, out, bg_sizes[density], opaque=True)


def in_app_images():
    images = os.path.join(ROOT, 'assets', 'base', 'images')
    render(icon_svg(), os.path.join(images, 'icon.png'), 152, opaque=True)
    render(mark_svg(), os.path.join(images, 'logo.png'), 667)


if __name__ == '__main__':
    ios_icons()
    ios_splash()
    android_icons()
    android_splash()
    in_app_images()
