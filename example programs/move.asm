	.define key_up 5
	.define key_down 8
	.define key_left 7
	.define key_right 9

# regs
	.define px 0
	.define py 1
	.define keyreg 2
	.define speedreg 3

init:
	ld_xkk speedreg 1
	ldi sprite

handlecontrols:
	# up
	ld_xkk keyreg key_up
	sknp keyreg
	sub py speedreg

	# down
	ld_xkk keyreg key_down
	sknp keyreg
	add py speedreg

	# left
	ld_xkk keyreg key_left
	sknp keyreg
	sub px speedreg

	# right
	ld_xkk keyreg key_right
	sknp keyreg
	add px speedreg

render:
	cls
	draw px py 8

	jmp handlecontrols

sprite:
	.data 0b00111100
	.data 0b01111110
	.data 0b11011111
	.data 0b11111111
	.data 0b11111111
	.data 0b11111111
	.data 0b01111110
	.data 0b00111100