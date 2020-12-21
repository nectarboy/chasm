# chASM
## Chip-8 Assembly Language in JavaScript

# what is chASM ?
chASM is a simple toy assembly language designed to quickly make games for the chip-8.
its syntax is very minimalistic and contains some of the minor q.o.l features many assembly languages have.

# features
chASM's features include:
| Feature       | Description                | Syntax                        |
|---------------|----------------------------|-------------------------------|
| Labels        | Used for program structure | `forever:`                    |
| Defines       | Used for common values     | `  .define funnynum 69`       |
| Data Sections | Used to insert raw data    | `  .data 0x80 0xff`           |
