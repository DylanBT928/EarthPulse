"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import ThreeGlobe from "three-globe";
import DataOverlayControls, { OverlayOptions } from "./DataOverlayControls";

export default function Globe() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeRef = useRef<ThreeGlobe | null>(null);
  const hasUserInteractedRef = useRef(false);
  const [overlayData, setOverlayData] = useState<OverlayOptions | null>(null);

  // Mock data generators for demonstration
  const generateAirQualityData = () => {
    const points = [];
    for (let i = 0; i < 500; i++) {
      points.push({
        lat: (Math.random() - 0.5) * 180,
        lng: (Math.random() - 0.5) * 360,
        pm25: Math.random() * 100,
        co2: 400 + Math.random() * 100,
        o3: Math.random() * 200,
        no2: Math.random() * 80,
      });
    }
    return points;
  };

  const generateFireData = () => {
    const fires: Array<{
      lat: number;
      lng: number;
      intensity: number;
      size: number;
    }> = [];
    // Focus on fire-prone regions
    const fireRegions = [
      { lat: 37, lng: -120, name: "California" },
      { lat: -25, lng: 135, name: "Australia" },
      { lat: 60, lng: 100, name: "Siberia" },
      { lat: -10, lng: -55, name: "Amazon" },
    ];

    fireRegions.forEach((region) => {
      for (let i = 0; i < 20; i++) {
        fires.push({
          lat: region.lat + (Math.random() - 0.5) * 10,
          lng: region.lng + (Math.random() - 0.5) * 20,
          intensity: Math.random(),
          size: Math.random() * 5 + 1,
        });
      }
    });
    return fires;
  };

  const handleOverlayChange = (overlays: OverlayOptions) => {
    setOverlayData(overlays);

    if (!globeRef.current) return;

    // Clear existing overlays
    globeRef.current
      .pointsData([])
      .ringsData([])
      .hexBinPointsData([])
      .arcsData([]);

    // Determine which data to show - prioritize temperature, then air quality
    let pointsToShow: any[] = [];
    let pointColorFn = (d: any) => "#4A90E2";
    let pointAltitude = 0.01;
    let pointRadius = 0.5;

    // Add temperature overlay using individual colored points (highest priority)
    if (overlays.weather.temperature) {
      // Create temperature data with realistic patterns - more points for better coverage
      for (let lat = -85; lat <= 85; lat += 2) {
        for (let lng = -180; lng <= 180; lng += 2) {
          // Base temperature on latitude (colder at poles, warmer at equator)
          let baseTemp = 25 - Math.abs(lat) * 0.7;

          // Add realistic regional patterns
          const seasonalVariation = Math.sin((lng / 180) * Math.PI) * 5;
          const randomVariation = (Math.random() - 0.5) * 8;

          const temperature = baseTemp + seasonalVariation + randomVariation;

          pointsToShow.push({
            lat: lat,
            lng: lng,
            temp: Math.max(-30, Math.min(45, temperature)),
            type: "temperature",
          });
        }
      }

      pointColorFn = (d: any) => {
        const temp = d.temp;

        // Traditional weather map colors - more muted and realistic
        if (temp >= 35) return "#8B0000"; // Dark red - very hot
        if (temp >= 30) return "#CD5C5C"; // Indian red - hot
        if (temp >= 25) return "#FF6347"; // Tomato - warm
        if (temp >= 20) return "#FFA500"; // Orange - mild warm
        if (temp >= 15) return "#FFD700"; // Gold - pleasant
        if (temp >= 10) return "#FFFF00"; // Yellow - cool pleasant
        if (temp >= 5) return "#9ACD32"; // Yellow green - cool
        if (temp >= 0) return "#00FF7F"; // Spring green - cold
        if (temp >= -5) return "#00CED1"; // Dark turquoise - very cold
        if (temp >= -15) return "#4169E1"; // Royal blue - freezing
        if (temp >= -25) return "#0000CD"; // Medium blue - very freezing
        return "#191970"; // Midnight blue - extreme cold
      };
      pointAltitude = 0.002; // Very low altitude for surface effect
      pointRadius = 0.6; // Slightly larger points for better coverage
    }
    // Add pollution plumes as colored particle trails
    else if (overlays.environmental.pollutionPlumes) {
      const pollutionSources = [
        { lat: 39.9, lng: 116.4, name: "Beijing" },
        { lat: 31.2, lng: 121.5, name: "Shanghai" },
        { lat: 28.7, lng: 77.1, name: "New Delhi" },
        { lat: 19.1, lng: 72.9, name: "Mumbai" },
        { lat: 34.7, lng: 135.5, name: "Osaka" },
        { lat: 40.7, lng: -74.0, name: "New York" },
        { lat: 34.1, lng: -118.2, name: "Los Angeles" },
        { lat: 51.5, lng: -0.1, name: "London" },
        { lat: 55.8, lng: 37.6, name: "Moscow" },
        { lat: -23.5, lng: -46.6, name: "São Paulo" },
      ];

      pollutionSources.forEach((source) => {
        for (let i = 0; i < 25; i++) {
          pointsToShow.push({
            lat: source.lat + (Math.random() - 0.5) * 8,
            lng: source.lng + (Math.random() - 0.5) * 10,
            concentration: Math.random(),
            type: "pollution",
          });
        }
      });

      pointColorFn = (d: any) => {
        const concentration = d.concentration;
        // Pollution colors - grey to dark red representing smog/pollution
        if (concentration > 0.8) return "#8B0000"; // Dark red - hazardous
        if (concentration > 0.6) return "#B22222"; // Fire brick - unhealthy
        if (concentration > 0.4) return "#CD5C5C"; // Indian red - moderate
        if (concentration > 0.2) return "#D2B48C"; // Tan - light pollution
        return "#C0C0C0"; // Silver - minimal
      };
      pointAltitude = 0.005;
      pointRadius = 0.4;
    }
    // Add humidity overlay using individual colored points
    else if (overlays.weather.humidity) {
      // Create humidity data with realistic patterns
      for (let lat = -85; lat <= 85; lat += 2) {
        for (let lng = -180; lng <= 180; lng += 2) {
          // Base humidity patterns: higher near equator and coasts, lower in deserts
          let baseHumidity = 60 - Math.abs(lat) * 0.3; // Higher humidity near equator

          // Add regional patterns for deserts and coastal areas
          const coastalEffect = Math.sin((lng / 90) * Math.PI) * 15;
          const desertEffect =
            Math.abs(lat) < 30 ? Math.sin((lng / 60) * Math.PI) * -20 : 0;
          const randomVariation = (Math.random() - 0.5) * 20;

          const humidity = Math.max(
            10,
            Math.min(
              95,
              baseHumidity + coastalEffect + desertEffect + randomVariation,
            ),
          );

          pointsToShow.push({
            lat: lat,
            lng: lng,
            humidity: humidity,
            type: "humidity",
          });
        }
      }

      pointColorFn = (d: any) => {
        const humidity = d.humidity;

        // Humidity color scale: dry (brown/red) to wet (blue/green)
        if (humidity >= 85) return "#000080"; // Navy blue - very humid
        if (humidity >= 75) return "#0000CD"; // Medium blue - humid
        if (humidity >= 65) return "#4169E1"; // Royal blue - moderate high
        if (humidity >= 55) return "#00CED1"; // Dark turquoise - moderate
        if (humidity >= 45) return "#32CD32"; // Lime green - moderate low
        if (humidity >= 35) return "#FFD700"; // Gold - low
        if (humidity >= 25) return "#FFA500"; // Orange - dry
        if (humidity >= 15) return "#FF6347"; // Tomato - very dry
        return "#8B0000"; // Dark red - extremely dry
      };
      pointAltitude = 0.002;
      pointRadius = 0.6;
    }
    // Add sea level rise data as coastal points
    else if (overlays.optional.seaLevel) {
      const coastalRegions = [
        { lat: 25.8, lng: -80.1, name: "Miami" },
        { lat: 52.4, lng: 4.9, name: "Netherlands" },
        { lat: 1.3, lng: 103.8, name: "Singapore" },
        { lat: -33.9, lng: 151.2, name: "Sydney" },
        { lat: 40.7, lng: -74.0, name: "New York" },
        { lat: 51.5, lng: -0.1, name: "London" },
        { lat: 13.4, lng: 144.8, name: "Guam" },
        { lat: -17.5, lng: -149.6, name: "Tahiti" },
        { lat: 26.2, lng: 50.6, name: "Bahrain" },
        { lat: 35.7, lng: 139.7, name: "Tokyo" },
      ];

      coastalRegions.forEach((region) => {
        for (let i = 0; i < 15; i++) {
          pointsToShow.push({
            lat: region.lat + (Math.random() - 0.5) * 3,
            lng: region.lng + (Math.random() - 0.5) * 4,
            riseLevel: Math.random() * 2 + 0.1, // 0.1-2.1 meters
            type: "sealevel",
          });
        }
      });

      pointColorFn = (d: any) => {
        const riseLevel = d.riseLevel;
        // Sea level colors - blue to red representing rise severity
        if (riseLevel > 1.5) return "#8B0000"; // Dark red - critical rise
        if (riseLevel > 1.0) return "#FF4500"; // Orange red - severe rise
        if (riseLevel > 0.5) return "#FFA500"; // Orange - moderate rise
        if (riseLevel > 0.2) return "#FFD700"; // Gold - minor rise
        return "#00CED1"; // Dark turquoise - minimal rise
      };
      pointAltitude = 0.003;
      pointRadius = 0.5;
    }
    // Add glacier melt data in polar and mountain regions
    else if (overlays.optional.glacierMelt) {
      const glacierRegions = [
        { lat: 64.1, lng: -21.9, name: "Iceland" },
        { lat: 78.2, lng: 15.6, name: "Svalbard" },
        { lat: -75.1, lng: 0, name: "Antarctica" },
        { lat: 61.2, lng: -149.9, name: "Alaska" },
        { lat: 46.5, lng: 7.7, name: "Swiss Alps" },
        { lat: 27.9, lng: 86.9, name: "Himalayas" },
        { lat: 60.6, lng: 8.7, name: "Norway" },
        { lat: -50.0, lng: -73.0, name: "Patagonia" },
        { lat: 82.5, lng: -82.0, name: "Greenland North" },
        { lat: 68.8, lng: -33.1, name: "Greenland East" },
      ];

      glacierRegions.forEach((region) => {
        for (let i = 0; i < 20; i++) {
          pointsToShow.push({
            lat: region.lat + (Math.random() - 0.5) * 8,
            lng: region.lng + (Math.random() - 0.5) * 12,
            meltRate: Math.random(),
            type: "glacier",
          });
        }
      });

      pointColorFn = (d: any) => {
        const meltRate = d.meltRate;
        // Glacier colors - white/blue to red representing melt severity
        if (meltRate > 0.8) return "#8B0000"; // Dark red - severe melting
        if (meltRate > 0.6) return "#FF6347"; // Tomato - high melting
        if (meltRate > 0.4) return "#FFA500"; // Orange - moderate melting
        if (meltRate > 0.2) return "#87CEEB"; // Sky blue - low melting
        return "#F0F8FF"; // Alice blue - stable ice
      };
      pointAltitude = 0.006;
      pointRadius = 0.6;
    }
    // Add deforestation data in forested regions
    else if (overlays.optional.deforestation) {
      const forestRegions = [
        { lat: -3.5, lng: -62.0, name: "Amazon" },
        { lat: 0.0, lng: 25.0, name: "Congo Basin" },
        { lat: 1.0, lng: 114.0, name: "Borneo" },
        { lat: 60.0, lng: 100.0, name: "Siberian Taiga" },
        { lat: 49.0, lng: -122.0, name: "Pacific Northwest" },
        { lat: -37.0, lng: 145.0, name: "Australia" },
        { lat: 62.0, lng: 25.0, name: "Scandinavian Forests" },
        { lat: 46.0, lng: -84.0, name: "Great Lakes" },
        { lat: -20.0, lng: -45.0, name: "Atlantic Forest Brazil" },
        { lat: 7.0, lng: -73.0, name: "Colombian Amazon" },
      ];

      forestRegions.forEach((region) => {
        for (let i = 0; i < 30; i++) {
          pointsToShow.push({
            lat: region.lat + (Math.random() - 0.5) * 15,
            lng: region.lng + (Math.random() - 0.5) * 20,
            lossRate: Math.random(),
            type: "deforestation",
          });
        }
      });

      pointColorFn = (d: any) => {
        const lossRate = d.lossRate;
        // Deforestation colors - green to brown/red representing forest loss
        if (lossRate > 0.8) return "#8B4513"; // Saddle brown - severe deforestation
        if (lossRate > 0.6) return "#D2691E"; // Chocolate - high deforestation
        if (lossRate > 0.4) return "#DEB887"; // Burlywood - moderate deforestation
        if (lossRate > 0.2) return "#9ACD32"; // Yellow green - low deforestation
        return "#228B22"; // Forest green - stable forest
      };
      pointAltitude = 0.004;
      pointRadius = 0.5;
    }
    // Add drought data as points in drought-prone regions
    else if (overlays.disasters.droughts) {
      const droughtRegions = [
        { lat: 35, lng: -120, name: "California" },
        { lat: 32, lng: -105, name: "US Southwest" },
        { lat: -25, lng: 135, name: "Australia" },
        { lat: -20, lng: 25, name: "Southern Africa" },
        { lat: 15, lng: 40, name: "Horn of Africa" },
        { lat: 25, lng: 75, name: "Western India" },
        { lat: -15, lng: -45, name: "Northeast Brazil" },
        { lat: 35, lng: 35, name: "Middle East" },
        { lat: 40, lng: 100, name: "Central Asia" },
      ];

      droughtRegions.forEach((region) => {
        for (let i = 0; i < 20; i++) {
          pointsToShow.push({
            lat: region.lat + (Math.random() - 0.5) * 12,
            lng: region.lng + (Math.random() - 0.5) * 15,
            severity: Math.random(),
            type: "drought",
          });
        }
      });

      pointColorFn = (d: any) => {
        const severity = d.severity;
        // Drought colors - browns and oranges representing dry conditions
        if (severity > 0.8) return "#8B4513"; // Saddle brown - extreme drought
        if (severity > 0.6) return "#A0522D"; // Sienna - severe drought
        if (severity > 0.4) return "#CD853F"; // Peru - moderate drought
        if (severity > 0.2) return "#DEB887"; // Burlywood - mild drought
        return "#F5DEB3"; // Wheat - abnormally dry
      };
      pointAltitude = 0.008;
      pointRadius = 0.8;
    }
    // Add heatwaves overlay as warning rings in hot regions
    else if (overlays.weather.heatwaves) {
      // Generate heatwave alerts in typically hot regions
      const heatwaveRegions = [
        { lat: 40, lng: -100, name: "US Midwest" },
        { lat: 45, lng: 2, name: "Europe" },
        { lat: 35, lng: 105, name: "China" },
        { lat: 28, lng: 77, name: "India" },
        { lat: -25, lng: 135, name: "Australia" },
        { lat: 35, lng: -115, name: "US Southwest" },
        { lat: 30, lng: 30, name: "Middle East" },
      ];

      heatwaveRegions.forEach((region) => {
        for (let i = 0; i < 15; i++) {
          pointsToShow.push({
            lat: region.lat + (Math.random() - 0.5) * 15,
            lng: region.lng + (Math.random() - 0.5) * 20,
            intensity: Math.random() * 0.8 + 0.2,
            type: "heatwave",
          });
        }
      });

      pointColorFn = (d: any) => {
        // Heatwave warning colors - red/orange spectrum
        const intensity = d.intensity;
        if (intensity > 0.8) return "#8B0000"; // Dark red - extreme
        if (intensity > 0.6) return "#FF0000"; // Red - severe
        if (intensity > 0.4) return "#FF4500"; // Orange red - moderate
        return "#FFA500"; // Orange - warning
      };
      pointAltitude = 0.015; // Slightly elevated for warning effect
      pointRadius = 1.2; // Larger points for visibility
    }
    // Add air quality points if temperature is not active
    else if (
      overlays.airQuality.pm25 ||
      overlays.airQuality.co2 ||
      overlays.airQuality.o3 ||
      overlays.airQuality.no2
    ) {
      pointsToShow = generateAirQualityData();
      pointColorFn = (d: any) => {
        if (overlays.airQuality.pm25) {
          // Color based on PM2.5 levels
          const pm25 = d.pm25;
          if (pm25 > 75) return "#8B0000"; // Dark red - unhealthy
          if (pm25 > 55) return "#FF4500"; // Orange red - unhealthy for sensitive
          if (pm25 > 35) return "#FFD700"; // Gold - moderate
          if (pm25 > 12) return "#90EE90"; // Light green - good
          return "#00FF00"; // Green - good
        }
        return "#4A90E2";
      };
      pointAltitude = 0.01;
      pointRadius = 0.5;
    }

    // Apply points data if any exists
    if (pointsToShow.length > 0) {
      globeRef.current
        .pointsData(pointsToShow)
        .pointColor(pointColorFn)
        .pointAltitude(pointAltitude)
        .pointRadius(pointRadius)
        .pointResolution(8); // Lower resolution for performance
    }

    // Add fire data
    if (overlays.disasters.fires) {
      const fireData = generateFireData();
      globeRef.current
        .ringsData(fireData)
        .ringColor(() => "#FF6B35")
        .ringMaxRadius((d: any) => d.size)
        .ringPropagationSpeed(2)
        .ringRepeatPeriod(1000);
    }

    // Add severe weather data as animated rings
    if (overlays.disasters.severeWeather) {
      const stormRegions = [
        { lat: 30, lng: -90, name: "Gulf of Mexico" },
        { lat: 40, lng: -100, name: "US Tornado Alley" },
        { lat: 25, lng: 120, name: "Western Pacific" },
        { lat: 10, lng: -60, name: "Caribbean" },
        { lat: 20, lng: 85, name: "Bay of Bengal" },
        { lat: -20, lng: 160, name: "South Pacific" },
        { lat: 45, lng: 10, name: "Central Europe" },
        { lat: -35, lng: 150, name: "Eastern Australia" },
      ];

      const severeWeatherData: any[] = [];
      stormRegions.forEach((region) => {
        for (let i = 0; i < 8; i++) {
          severeWeatherData.push({
            lat: region.lat + (Math.random() - 0.5) * 20,
            lng: region.lng + (Math.random() - 0.5) * 25,
            intensity: Math.random() * 0.7 + 0.3,
            size: Math.random() * 3 + 2,
          });
        }
      });

      globeRef.current
        .ringsData(severeWeatherData)
        .ringColor((d: any) => {
          const intensity = d.intensity;
          // Storm colors - blues and purples for severe weather
          if (intensity > 0.8) return "#4B0082"; // Indigo - extreme weather
          if (intensity > 0.6) return "#8A2BE2"; // Blue violet - severe
          if (intensity > 0.4) return "#9370DB"; // Medium orchid - moderate
          return "#87CEEB"; // Sky blue - normal storm
        })
        .ringMaxRadius((d: any) => d.size)
        .ringPropagationSpeed(1.5)
        .ringRepeatPeriod(800);
    }

    // Add wind patterns as flowing arcs (like earth.nullschool.net)
    if (overlays.environmental.windVectors) {
      const windArcs: any[] = [];

      // Generate flowing wind particle trails
      for (let lat = -80; lat <= 80; lat += 6) {
        for (let lng = -180; lng <= 180; lng += 8) {
          // Simulate realistic wind patterns based on latitude
          let windDirection = 0;
          let windSpeed = Math.random() * 25 + 5; // 5-30 mph

          if (Math.abs(lat) < 30) {
            // Trade winds - blow east to west (easterly)
            windDirection = 270 + (Math.random() - 0.5) * 40; // Easterly with variation
          } else if (Math.abs(lat) < 60) {
            // Westerlies - blow west to east
            windDirection = 90 + (Math.random() - 0.5) * 40; // Westerly with variation
          } else {
            // Polar easterlies - blow east to west
            windDirection = 270 + (Math.random() - 0.5) * 40; // Easterly with variation
          }

          // Create flowing arcs that follow wind patterns
          const arcLength = (windSpeed / 30) * 8; // Length based on wind speed
          const endLng =
            lng + Math.cos((windDirection * Math.PI) / 180) * arcLength;
          const endLat =
            lat + Math.sin((windDirection * Math.PI) / 180) * arcLength * 0.3;

          windArcs.push({
            startLat: lat,
            startLng: lng,
            endLat: Math.max(-85, Math.min(85, endLat)),
            endLng: ((endLng + 180) % 360) - 180, // Wrap longitude
            speed: windSpeed,
          });
        }
      }

      globeRef.current
        .arcsData(windArcs)
        .arcStartLat("startLat")
        .arcStartLng("startLng")
        .arcEndLat("endLat")
        .arcEndLng("endLng")
        .arcColor((d: any) => {
          const speed = d.speed;
          // Wind speed colors matching earth.nullschool.net style - more visible colors
          if (speed > 25) return "#ffffff"; // White - very strong winds
          if (speed > 20) return "#00ffff"; // Cyan - strong winds
          if (speed > 15) return "#00bfff"; // Deep sky blue - moderate winds
          if (speed > 10) return "#0080ff"; // Dodger blue - light winds
          return "#4da6ff"; // Blue - very light winds
        })
        .arcStroke((d: any) => Math.max(0.4, d.speed / 30)) // Thicker lines for stronger winds
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime((d: any) => Math.max(800, 2500 - d.speed * 50)); // Faster animation for stronger winds
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 180;

    // Renderer setup with enhanced settings
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Globe setup with high-resolution textures
    const globe = new ThreeGlobe({
      waitForGlobeReady: true,
      animateIn: true,
    })
      // High-resolution Earth texture (8K)
      .globeImageUrl(
        "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
      )
      // High-resolution bump/normal map for topography
      .bumpImageUrl(
        "https://unpkg.com/three-globe/example/img/earth-topology.png",
      )
      // Enhanced atmosphere
      .showAtmosphere(true)
      .atmosphereColor("#87CEEB")
      .atmosphereAltitude(0.15)
      // Enhanced visual settings
      .globeMaterial(
        new THREE.MeshPhongMaterial({
          bumpScale: 10,
          shininess: 0.1,
          transparent: false,
        }),
      )
      // Add night lights
      .showGlobe(true);

    globeRef.current = globe;
    scene.add(globe);

    // Enhanced lighting setup - much brighter
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);

    // Main directional light (sun) - increased intensity
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(1, 0.5, 1);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Secondary fill light - brighter
    const fillLight = new THREE.DirectionalLight(0x7ec0ee, 0.8);
    fillLight.position.set(-1, 0.5, -1);
    scene.add(fillLight);

    // Add rim lighting - brighter
    const rimLight = new THREE.DirectionalLight(0x0077be, 0.5);
    rimLight.position.set(0, 0, -1);
    scene.add(rimLight);

    // Mouse controls for drag interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (event: MouseEvent) => {
      isDragging = true;
      hasUserInteractedRef.current = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
      document.body.style.cursor = "grabbing";
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y,
      };

      // Rotate globe based on mouse movement
      if (globeRef.current) {
        const rotationSpeed = 0.005;
        globeRef.current.rotation.y += deltaMove.x * rotationSpeed;
        globeRef.current.rotation.x += deltaMove.y * rotationSpeed;

        // Limit vertical rotation to prevent flipping
        globeRef.current.rotation.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, globeRef.current.rotation.x),
        );
      }

      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
      document.body.style.cursor = "grab";
    };

    // Zoom controls with adaptive sensitivity
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const minDistance = 120;
      const maxDistance = 800;

      // Calculate adaptive zoom speed based on current distance
      // Closer to Earth = slower zoom, farther = faster zoom
      const currentDistance = camera.position.z;
      const distanceRatio =
        (currentDistance - minDistance) / (maxDistance - minDistance);
      const slowZoomSpeed = 0.03; // Very slow when zoomed in
      const fastZoomSpeed = 0.12; // Fast when zoomed out
      const adaptiveZoomSpeed =
        slowZoomSpeed + distanceRatio * (fastZoomSpeed - slowZoomSpeed);

      camera.position.z += event.deltaY * adaptiveZoomSpeed;
      camera.position.z = Math.max(
        minDistance,
        Math.min(maxDistance, camera.position.z),
      );
    };

    // Set initial cursor
    document.body.style.cursor = "grab";

    // Event listeners
    renderer.domElement.addEventListener("mousedown", handleMouseDown);
    renderer.domElement.addEventListener("mousemove", handleMouseMove);
    renderer.domElement.addEventListener("mouseup", handleMouseUp);
    renderer.domElement.addEventListener("wheel", handleWheel);

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("resize", handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Auto-rotate when not dragging and user hasn't interacted
      if (!isDragging && !hasUserInteractedRef.current && globeRef.current) {
        globeRef.current.rotation.y += 0.0005;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousedown", handleMouseDown);
      renderer.domElement.removeEventListener("mousemove", handleMouseMove);
      renderer.domElement.removeEventListener("mouseup", handleMouseUp);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      document.body.style.cursor = "auto";

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div ref={mountRef} className="w-full h-full" />

      {/* Data Overlay Controls */}
      <DataOverlayControls onOverlayChange={handleOverlayChange} />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-8 left-8 pointer-events-auto">
          <h1 className="text-4xl font-bold text-white mb-2">
            Earth<span className="text-blue-400">Pulse</span> 🌍
          </h1>
          <p className="text-white/80 text-sm max-w-xs">
            Interactive 3D globe visualizing live environmental data
          </p>
        </div>

        <div className="absolute bottom-8 right-8 pointer-events-auto">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white text-xs">
            <div className="mb-2 font-medium">Controls:</div>
            <div>• Drag to rotate</div>
            <div>• Scroll to zoom</div>
            <div>• Use data overlays panel</div>
          </div>
        </div>

        <div className="absolute bottom-8 left-8 pointer-events-auto">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-xs">
            <div className="text-white/60">Inspired by</div>
            <a
              href="https://earth.nullschool.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              earth.nullschool.net
            </a>
          </div>
        </div>

        {/* Legend for active overlays */}
        {overlayData && (
          <div className="absolute top-8 right-8 pointer-events-auto">
            <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white text-xs max-w-xs">
              <div className="font-medium mb-2">Active Data Layers</div>

              {overlayData.airQuality.pm25 && (
                <div className="mb-2">
                  <div className="font-medium text-yellow-400">
                    PM2.5 Air Quality
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Good (0-12)</span>
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span>Moderate (12-35)</span>
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Unhealthy (35+)</span>
                  </div>
                </div>
              )}

              {overlayData.disasters.fires && (
                <div className="mb-2">
                  <div className="font-medium text-orange-400">
                    Active Fires
                  </div>
                  <div className="text-white/60">Real-time fire detection</div>
                </div>
              )}

              {overlayData.weather.temperature && (
                <div className="mb-2">
                  <div className="font-medium text-blue-400">Temperature</div>
                  <div className="text-white/60">Surface temperature (°C)</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
