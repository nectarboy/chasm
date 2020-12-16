maze:
# pick random maze piece
	rnd 2 1

# assign i to maze piece depending on v 2 (random number)
	seq_xkk 2 1
	jmp pickleft
	ldi r

drawandadvance:
	draw 0 1 4
	add_xkk 0 4
# check if at the wall
	sne_xkk 0 64
	call resetxy
# start again
	jmp maze	

pickleft:
	ldi l
	jmp draw

resetxy:
	ld_xkk 0 0
	add_xkk 1 4
	ret

l:
	.data 0b1000
	.data 0b0100
	.data 0b0010
	.data 0b0001
r:
	.data 0b0001
	.data 0b0010
	.data 0b0100
	.data 0b1000