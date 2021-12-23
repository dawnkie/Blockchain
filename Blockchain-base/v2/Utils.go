package v2

import (
	"bytes"
	"encoding/binary"
	"fmt"
	_ "github.com/go-sql-driver/mysql" // init() 向"database/sql"注册"mysql"驱动
)

func UintToBytes(num uint64) []byte {
	var buffer bytes.Buffer
	CheckError(binary.Write(&buffer, binary.BigEndian, num), "UintToBytes")
	return buffer.Bytes()
}



func BytesToUint(bs []byte) uint64 {
	buffer := bytes.NewBuffer(bs)
	var num uint64
	CheckError(binary.Read(buffer, binary.BigEndian, &num), "BytesToUint")
	return num
}

func CheckError(err error, info string) {
	if err != nil {
		fmt.Sprintln(info, "\r\n", err)
	}
}