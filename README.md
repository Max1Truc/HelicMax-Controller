# HelicMax-XXXXXX control/hijack script
## Compatible drones

This script probably works with a huge range of very similar drones. For example this is the one i own:

![IR Drones SkyVision](invalid link)

But if your drone is controllable by connecting to a wifi network with an SSID that starts with "HelicMax" this script should be able to control/hijack it.

Sidenote: If your drone can be controlled by an android app created by [MARK mai](https://play.google.com/store/apps/developer?id=MARK%20mai) but has a different wifi AP name, this script will probably still work. You can either try to bypass the wifi connection part of the script or [open an issue](https://github.com/Boltgolt/rcl-rc127/issues/new).

## Usage

1. Clone this repo `git clone https://github.com/Max1Truc/HelicMax-Controller`.
2. Check your NodeJS version (>= 12)
3. Install required node modules `npm install`.
4. Turn on your done and **wait for at least 15 to 30 seconds** to allow your PC to pick up the new wifi AP.
5. Run `node index.js` to launch the script.

## Controls

The drone is controlled using the numpad:

Key     | Number | Action
------- | ------ | -------------
Up      | 8      | Forward
Down    | 2      | Backward
Left    | 4      | Left
Right   | 6      | Right
Home    | 7      | Throttle up
End     | 1      | Throttle down
None    | 5      | Reset
Q / Esc |        | Quit script
