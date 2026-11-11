      (function () {
        "use strict";

        var els = {
          order1: document.getElementById("order1"),
          order2: document.getElementById("order2"),
          ca0: document.getElementById("ca0"),
          k: document.getElementById("k"),
          t: document.getElementById("t"),
          ca0Num: document.getElementById("ca0Num"),
          kNum: document.getElementById("kNum"),
          tNum: document.getElementById("tNum"),
          kUnit: document.getElementById("kUnit"),
          formulaDisplay: document.getElementById("formulaDisplay"),
          caNum: document.getElementById("caNum"),
          xaNum: document.getElementById("xaNum"),
          statusDot: document.getElementById("statusDot"),
          statusText: document.getElementById("statusText"),
          readoutCard: document.getElementById("readoutCard"),
          liquidRect: document.getElementById("liquidRect"),
          meniscus: document.getElementById("meniscus"),
          resetBtn: document.getElementById("resetBtn"),
          ca0Fill: document.getElementById("ca0Fill"),
          kFill: document.getElementById("kFill"),
          tFill: document.getElementById("tFill"),
          trendPath: document.getElementById("trendPath"),
          trendMarker: document.getElementById("trendMarker"),
          guideV: document.getElementById("guideV"),
          guideH: document.getElementById("guideH"),
          yLabelTop: document.getElementById("yLabelTop"),
          yLabelMid: document.getElementById("yLabelMid"),
        };

        var STATE_COLORS = {
          idle: "#7C8880",
          red: "#B3402F",
          amber: "#C98A2C",
          green: "#4C7A4A",
        };
        var STATE_LABELS = {
          idle: "Standby",
          red: "Low conversion",
          amber: "In progress",
          green: "Near complete",
        };
        var DEFAULTS = { ca0: 5.0, k: 0.05, t: 0 };

        function clamp(v, lo, hi) {
          return Math.min(hi, Math.max(lo, v));
        }

        function calcCA(ca0, k, t, order) {
          if (order === "1") {
            return ca0 * Math.exp(-k * t);
          }
          return ca0 / (1 + k * t * ca0);
        }

        function pctToLiquid(pct) {
          var top = 56,
            bottom = 252,
            full = bottom - top;
          var height = clamp(pct, 0, 1) * full;
          return { y: bottom - height, height: height };
        }

        function setTrackFill(input, fillEl) {
          var min = parseFloat(input.min),
            max = parseFloat(input.max),
            val = parseFloat(input.value);
          var pct = ((val - min) / (max - min)) * 100;
          fillEl.style.width = pct + "%";
        }

        function xScale(t) {
          var x0 = 40,
            x1 = 390,
            tMax = 100;
          return x0 + (t / tMax) * (x1 - x0);
        }
        function yScale(ca, ca0) {
          var y0 = 160,
            y1 = 14;
          var ratio = ca0 > 0 ? ca / ca0 : 0;
          return y0 + ratio * (y1 - y0);
        }

        function drawTrend(ca0, k, order, tCurrent, caCurrent, color) {
          var steps = 60,
            d = "",
            i,
            t,
            ca,
            x,
            y;
          for (i = 0; i <= steps; i++) {
            t = (i / steps) * 100;
            ca = calcCA(ca0, k, t, order);
            x = xScale(t);
            y = yScale(ca, ca0);
            d +=
              (i === 0 ? "M" : "L") + x.toFixed(2) + "," + y.toFixed(2) + " ";
          }
          els.trendPath.setAttribute("d", d.trim());

          var mx = xScale(tCurrent);
          var my = yScale(caCurrent, ca0);
          els.trendMarker.setAttribute("cx", mx.toFixed(2));
          els.trendMarker.setAttribute("cy", my.toFixed(2));
          els.trendMarker.style.fill = color;

          els.guideV.setAttribute("x1", mx.toFixed(2));
          els.guideV.setAttribute("x2", mx.toFixed(2));
          els.guideV.setAttribute("y1", my.toFixed(2));
          els.guideV.setAttribute("y2", "160");

          els.guideH.setAttribute("x1", "40");
          els.guideH.setAttribute("x2", mx.toFixed(2));
          els.guideH.setAttribute("y1", my.toFixed(2));
          els.guideH.setAttribute("y2", my.toFixed(2));

          els.yLabelTop.textContent = ca0.toFixed(1);
          els.yLabelMid.textContent = (ca0 / 2).toFixed(1);
        }

        function update() {
          var order = els.order2.checked ? "2" : "1";
          var ca0 = parseFloat(els.ca0.value);
          var k = parseFloat(els.k.value);
          var t = parseFloat(els.t.value);

          var ca = calcCA(ca0, k, t, order);
          var xa = ca0 > 0 ? clamp((ca0 - ca) / ca0, 0, 1) : 0;

          els.ca0Num.textContent = ca0.toFixed(1);
          els.kNum.textContent = k.toFixed(2);
          els.tNum.textContent = t.toFixed(0);
          els.kUnit.textContent =
            order === "1" ? " min\u207B\u00B9" : " L/(mol\u00B7min)";

          els.formulaDisplay.textContent =
            order === "1"
              ? "C\u2090 = C\u2090\u2080 \u00B7 e^(\u2212k\u00B7t)"
              : "C\u2090 = C\u2090\u2080 / (1 + k\u00B7t\u00B7C\u2090\u2080)";

          els.caNum.textContent = ca.toFixed(2);
          els.xaNum.textContent = (xa * 100).toFixed(1);

          var state =
            t === 0 ? "idle" : xa < 0.5 ? "red" : xa < 0.9 ? "amber" : "green";
          els.statusDot.setAttribute("data-state", state);
          els.readoutCard.setAttribute("data-state", state);
          els.statusText.textContent = STATE_LABELS[state];
          els.xaNum.style.color = state === "idle" ? "" : STATE_COLORS[state];

          var liquid = pctToLiquid(xa);
          els.liquidRect.setAttribute("y", liquid.y.toFixed(2));
          els.liquidRect.setAttribute(
            "height",
            Math.max(liquid.height, 0).toFixed(2),
          );
          els.liquidRect.style.fill = STATE_COLORS[state];
          els.meniscus.setAttribute("y", (liquid.y - 1.5).toFixed(2));
          els.meniscus.style.fill = STATE_COLORS[state];

          setTrackFill(els.ca0, els.ca0Fill);
          setTrackFill(els.k, els.kFill);
          setTrackFill(els.t, els.tFill);

          drawTrend(ca0, k, order, t, ca, STATE_COLORS[state]);
        }

        [els.ca0, els.k, els.t].forEach(function (el) {
          el.addEventListener("input", update);
        });
        els.order1.addEventListener("change", update);
        els.order2.addEventListener("change", update);

        els.resetBtn.addEventListener("click", function () {
          els.order1.checked = true;
          els.ca0.value = DEFAULTS.ca0;
          els.k.value = DEFAULTS.k;
          els.t.value = DEFAULTS.t;
          update();
        });

        update();
      })();
