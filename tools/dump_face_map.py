from pathlib import Path
p=Path(r'D:\baiduyundownload\三国英杰传\三国英杰传\SGYJ\BAKDATA.R3')
d=p.read_bytes()
for i in [0,1,2,3,4,5,6,7,8,9,11,12,15,19,20,21,22,26,27,46,47,142,143,176,182,368,382,383]:
 a=0x1100+i*21
 print(i,hex(a),d[a:a+21].hex(' '))
