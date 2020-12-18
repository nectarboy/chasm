# defines
	.define v_y 0
	.define v_sy 1
	.define v_grav 2

	.define acc 20

main:
	ldi sprite
loop:

# update velocity and sub position
	add_xkk v_grav acc
	add v_sy v_grav

# update y position based on sub position
	sne_xkk 0xf 1
	call ballgodown
draw:
	cls
	draw 32

ballgodown:
# what happens when the suby overflows
	add_xkk v_y 1
	seq_xkk v_y 60
	ret
	jmp forever

forever:
	jmp forever

# ball sprite
sprite:
	.data 0b0110
	.data 0b1011
	.data 0b1111
	.data 0b0110