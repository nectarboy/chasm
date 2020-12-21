# chASM
***Chip-8 Assembly Language in JavaScript***

# what is chASM ?
chASM is a *simple toy assembly language* designed to quickly make games for the chip-8.
its syntax is very minimalistic and contains some of the minor q.o.l features many assembly languages have.

# features
chASM has a few simple features:
| Feature       | Description                | Syntax                        |
|---------------|----------------------------|-------------------------------|
| Labels        | Used for program structure | `label:`                      |
| Defines       | Used for common values     | `  .define funnynum 69`       |
| Data Sections | Used to insert raw data    | `  .data 0x80 0xff`           |

# usage
chASM is not meant to be taken as a professional programming language;
it is a toy language designed to swiftly make small programs.

here is an example program that draws a random maze:
```
  .define size 4
  
maze:
# pick random maze piece
	rnd 2 1
# assign i to maze piece depending on v 2 (random number)
	seq_xkk 2 1
	jmp pickleft
	ldi r

drawandadvance:
	draw 0 1 size
	add_xkk 0 size
# check if at the wall
	sne_xkk 0 64
	call resetxy
# start again
	jmp maze	

pickleft:
	ldi l
	jmp drawandadvance

resetxy:
	ld_xkk 0 0
	add_xkk 1 size
	call checkatend
	ret

checkatend:
	sne_xkk 1 32
	jmp forever
	ret

forever:
	jmp forever
  
# maze sprites
l:
	.data 0x80 0x40 0x20 0x10
r:
	.data 0x10 0x20 0x40 0x80
```

# conclusion
well, thats all there is to chASM, have fun !
