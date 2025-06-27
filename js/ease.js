const easeFuncs = [
  t => t, // linear - 1
  t => Math.sin((t * Math.PI) / 2), // out sine - 2
  t => 1 - Math.cos((t * Math.PI) / 2), // in sine - 3
  t => 1 - (1 - t) * (1 - t), // out quad - 4
  t => t ** 2, // in quad - 5
  t => -(Math.cos(Math.PI * t) - 1) / 2, // io sine - 6
  t => t < 0.5 ? 2 * (t ** 2) : 1 - (-2 * t + 2) ** 2 / 2, // io quad - 7
  t => 1 - (1 - t) ** 3, // out cubic - 8
  t => t ** 3, // in cubic - 9
  t => 1 - (1 - t) ** 4, // out quart - 10
  t => t ** 4, // in quart - 11
  t => t < 0.5 ? 4 * (t ** 3) : 1 - (-2 * t + 2) ** 3 / 2, // io cubic - 12
  t => t < 0.5 ? 8 * (t ** 4) : 1 - (-2 * t + 2) ** 4 / 2, // io quart - 13
  t => 1 - (1 - t) ** 5, // out quint - 14
  t => t ** 5, // in quint - 15
  t => t === 1 ? 1 : 1 - 2 ** (-10 * t), // out expo - 16
  t => t === 0 ? 0 : 2 ** (10 * t - 10), // in expo - 17
  t => 1 - Math.sqrt(1 - t ** 2), // out circ - 18
  t => 1 - Math.sqrt(1 - t ** 2), // in circ - 19
  t => 1 + 2.70158 * ((t - 1) ** 3) + 1.70158 * ((t - 1) ** 2), // out back - 20
  t => 2.70158 * (t ** 3) - 1.70158 * (t ** 2), // in back - 21
  t => t < 0.5 ? (1 - Math.sqrt(1 - (2 * t) ** 2)) / 2 : (((1 - (-2 * t + 2) ** 2) ** 0.5) + 1) / 2, // io circ - 22
  t => t < 0.5 ? ((2 * t) ** 2 * ((2.5949095 + 1) * 2 * t - 2.5949095)) / 2 : ((2 * t - 2) ** 2 * ((2.5949095 + 1) * (t * 2 - 2) + 2.5949095) + 2) / 2, // io back - 23
  t => t === 0 ? 0 : (t === 1 ? 1 : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1), // out elastic - 24
  t => t === 0 ? 0 : (t === 1 ? 1 : (-2) ** (10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI / 3))), // in elastic - 25
  t => {
    if (t < 1 / 2.75) return 7.5625 * (t ** 2);
    else if (t < 2 / 2.75) return 7.5625 * (t - 1.5 / 2.75) ** 2 + 0.75;
    else if (t < 2.5 / 2.75) return 7.5625 * (t - 2.25 / 2.75) ** 2 + 0.9375;
    else return 7.5625 * (t - 2.625 / 2.75) ** 2 + 0.984375; // out bounce - 26
  },
  t => {
    const invT = 1 - t;
    if (invT < 1 / 2.75) return 1 - 7.5625 * (invT ** 2);
    else if (invT < 2 / 2.75) return 1 - (7.5625 * (invT - 1.5 / 2.75) ** 2 + 0.75);
    else if (invT < 2.5 / 2.75) return 1 - (7.5625 * (invT - 2.25 / 2.75) ** 2 + 0.9375);
    else return 1 - (7.5625 * (invT - 2.625 / 2.75) ** 2 + 0.984375); // in bounce - 27
  },
  t => {
    if (t < 0.5) {
      const halfT = 1 - 2 * t;
      if (halfT < 1 / 2.75) return (1 - 7.5625 * (halfT ** 2)) / 2;
      else if (halfT < 2 / 2.75) return (1 - (7.5625 * (halfT - 1.5 / 2.75) ** 2 + 0.75)) / 2;
      else if (halfT < 2.5 / 2.75) return (1 - (7.5625 * (halfT - 2.25 / 2.75) ** 2 + 0.9375)) / 2;
      else return (1 - (7.5625 * (halfT - 2.625 / 2.75) ** 2 + 0.984375)) / 2;
    } else {
      const halfT = 2 * t - 1;
      if (halfT < 1 / 2.75) return (1 + 7.5625 * (halfT ** 2)) / 2;
      else if (halfT < 2 / 2.75) return (1 + (7.5625 * (halfT - 1.5 / 2.75) ** 2 + 0.75)) / 2;
      else if (halfT < 2.5 / 2.75) return (1 + (7.5625 * (halfT - 2.25 / 2.75) ** 2 + 0.9375)) / 2;
      else return (1 + (7.5625 * (halfT - 2.625 / 2.75) ** 2 + 0.984375)) / 2; // io bounce - 28
    }
  },
  t => {
    if (t === 0) return 0;
    else if (t === 1) return 1;
    else if (t < 0.5) {
      return ((-2) ** (20 * t - 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI / 4.5))) / 2;
    } else {
      return (2 ** (-20 * t + 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI / 4.5))) / 2 + 1; // io elastic - 29
    }
  }
];