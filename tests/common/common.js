function Canvas (w, h) {
	var c = document.createElement('canvas');

	c.width = w;
	c.height = h;

	return c;
}

function plot (fx, a, p, scale, w, h, s, ha) {
	function text (x, y) {
		var txt = [].slice.call(arguments, 2).join(' ');
		ctx.fillText(txt, x, y);
	}

	var i, k, n, x, y, sx, c, ctx, fft, sh, rr, ii, bs;

	w = ~~w || 1400;
	h = ~~h || 600;

	c = Canvas(w, h);

	ctx = c.getContext('2d');

	fft = fx.getFrequencyResponse(a, s, p);

	s = s || fft.length / 2;

	sh = s / 2;
	sx = w / sh;
	bs = 2 / s * h * (scale || 1);

	ctx.beginPath();
	ctx.moveTo(0, h);

	for (i=0, n=2, x=0; i<s; i++, n+=2, x+=sx) {
		rr = fft[n + 0];
		ii = fft[n + 1];

		y = bs * Math.sqrt(rr * rr + ii * ii);

		ctx.lineTo(x, h - y);
	}

	ctx.stroke();

	ctx.lineTo(w, h);
	ctx.lineTo(0, h);

	ctx.closePath();

	ctx.fill();

	ctx.save();
	qha: if (!ha) {
		ctx.font = '12px Arial';
		ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
		ctx.shadowBlur = 3;
		ctx.shadowColor = '#ffffff';

		i = 1;

		text(5, 12 * i++, fx.name);
		text(5, 12 * i++, 'Args:', (a||[]).join(', '));

		if (scale) {
			text(5, 12 * i++, 'Scale:', scale);
		}

		if (!p) break qha;

		for (k in p) {
			if (p.hasOwnProperty(k)) {
				text(5, 12 * i++, k, ':', p[k]);
			}
		}

	}
	ctx.restore();

	return c;
}

function insert () {
	var i, args = [].slice.call(arguments);

	for (i=0; i<args.length; i++) {
		document.body.appendChild(args[i]);
	}
}

function insertPlot () {
	var c = plot.apply(this, arguments);

	insert(c);

	return c;
}
