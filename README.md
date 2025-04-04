# WiFi Near Me - Network Mindmap

A visualization tool for WiFi pentesting data captured with FlipperZero and Marauder software. This tool creates an interactive mindmap visualization of nearby WiFi networks and connected devices.

## Features

- Visual mindmap of WiFi networks with you at the center
- Access points arranged in a circle around you
- Connected devices shown around their associated access points
- Interactive visualization with zoom and drag capabilities

## Usage

1. Open `index.html` in a web browser
2. Upload your Marauder station list log file (from `list -c` command)
3. Click "EXECUTE_SCAN" to visualize the network data

## Flipper Zero Workflow

1. On your Flipper Zero, open the Marauder App
2. Use "Scan (APs)" to discover access points
3. Use "Scan (devices)" to find connected devices
4. Run "List (devices)" to generate the log file
5. Download the latest .log file from your Flipper Zero
6. Upload this log file to the WIFI_NEAR_ME visualizer

## Supported Log Format

The parser expects the Marauder station list format (from the `list -c` command). Example:

```
[0] NetworkName1 :
  [1] 11:22:33:44:55:66
[1] NetworkName2 :
  [2] aa:bb:cc:dd:ee:ff
  [3] 11:22:33:aa:bb:cc
```

## Customization

You can modify the visualization appearance by editing the CSS in `style.css` or adjusting the visualization parameters in `src/visualizer.js`.
