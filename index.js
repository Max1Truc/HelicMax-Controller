// Import required modules
const wifi = require("node-wifi")
const colors = require("colors/safe")
const dgram = require("dgram")

// Import other node files
const magic = require("./magic.js")
const controller = require("./controller.js")

// Hardcode drone IP and ports
const drone = {
  ip: "192.168.0.1",
  udpPort: 40000
}

// Init UDP socket object, this sockets is sending instructions to the drone
let udpControl = dgram.createSocket("udp4")

// Will shut down drone when true
let shutDown = false

// Init OS wifi integration
wifi.init({
  // Allow any wifi interface
  iface: null
})

/**
 * Prints a nice massage to the console
 * @param  {String} text  Message to be shown
 * @param  {Bool}   error When true, will print as error and quit the program
 */
global.print = function(text, error) {
  // Get the current time and add a leading 0 when needed
  let d = new Date()
  let h = (d.getHours() < 10 ? "0" : "") + d.getHours()
  let m = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes()
  let s = (d.getSeconds() < 10 ? "0" : "") + d.getSeconds()

  // Turn the text red if this is a critical error
  if (error) {
    text = colors.red.bold(text)
  }

  // Write it all to console
  process.stdout.write(`[${h}:${m}:${s}] ${text}\n`)

  // If an error, stop the script
  if (error) {
    process.exit(1)
  }
}

// Let the user know we're starting the scan
print("Scanning for drone wifi network...")

// Scan for availible wifi networks
wifi.scan(function(err, networks) {
  // Catch error and quit script
  if (err) {
    print("Could not scan for wifi networks", true)
  } else {
    // Default to false to catch no-drone error
    let network = false

    // Loop through wifi networks
    for (let i in networks) {
      // If network SSID looks like a drone network, save that and stop the loop
      if (/HelicMax-[0-9]*/.test(networks[i].ssid)) {
        network = networks[i]
        break
      }
    }

    // If we couldn't find a network, stop script with error
    if (network === false) {
      print("Could not find drone network", true)
    } else {
      // Let the user know to what drone we're connecting
      print(`Connecting to "${network.ssid}" (${network.mac})`)

      wifi.connect({
        ssid: network.ssid,
        password: ""
      }, function(err) {
        if (err) {
          print("Could not connect to the drone wifi network", true)
        } else {
          // Let the user know we're opening the UDP connection to the drone
          print("Opening control socket to drone...")

          // Connect to the UDP server on the drone
          udpControl.connect(drone.udpPort, drone.ip, function() {
            // Send the magic packet that will wake the drone up (lights will stop flashing at this point)
            udpControl.send(magic.udpStart, 0, magic.udpStart.length)

            // Let the user know we have a connection now
            print(colors.green("Connected to drone!"))

            // Start the controller terminal interface
            controller.start(stopDrone)

            // Send the first UDP packet with all default fields, which will put al conrols in the natural position
            udpControl.send(magic.defaultUdp)

            // Send a control UDP packet every 50ms
            setInterval(function() {
              // If the user has send the quit signal
              if (shutDown) {
                // Get the natural UDP datagram
                let stopUdp = magic.defaultUdp
                // Set the throttle to 1/256, which will shut down the rotors from any state
                stopUdp[10] = 0x00
                stopUdp[13] = stopUdp[8] ^ stopUdp[9] ^ stopUdp[10] ^ stopUdp[11]

                // Send the datagram aff to the drone and stop here
                return udpControl.send(stopUdp)
              }

              // Get the natural UDP datagram
              let data = magic.defaultUdp

              // Translate the -1 to 1 value of the horizontal axis to 0-256 and insert it into the natural datagram
              data[8] = Math.round((controller.state.hor + 1) * 127)
              // Translate the -1 to 1 value of the vertical axis to 0-256 and insert it into the natural datagram
              data[9] = Math.round((controller.state.ver + 1) * 127)
              // Translate the 0 to 2 value of the throttle to 0-256 and insert it into the natural datagram
              data[10] = Math.round(controller.state.thr * 127)

              // Generate the new XOR checksum for this datagram
              data[13] = data[8] ^ data[9] ^ data[10] ^ data[11]

              // Send the datagram off to the drone
              udpControl.send(data)
            }, 50)
          })
        }
      })
    }
  }
})

/**
 * Stops drone gracefully
 */
function stopDrone() {
  // Set the global accordingly
  shutDown = true

  // Wait 1s for the shutdown to reach the drone and stop the script
  setTimeout(function() {
    process.exit()
  }, 1000)
}
