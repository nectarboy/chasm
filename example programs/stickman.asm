	.define stickmanheight 5

	ldi stickman
	draw 0 1 stickmanheight
forever:
	jmp forever

stickman:
	.data 0b00011000
	.data 0b01111110
	.data 0b00011000
	.data 0b00100100
	.data 0b01000010 