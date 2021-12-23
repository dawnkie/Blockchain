package v1

import (
	"bytes"
	"encoding/binary"
	"fmt"
)

func UintToBytes(num uint64) []byte {
	var buffer bytes.Buffer
	CheckError(binary.Write(&buffer, binary.BigEndian, num), "UintToBytes")
	return buffer.Bytes()
}

func CheckError(err error, info string) {
	if err != nil {
		fmt.Sprintln(info, "\r\n", err)
	}
}

func BytesToUint(bs []byte) uint64 {
	buffer := bytes.NewBuffer(bs)
	var num uint64
	CheckError(binary.Read(buffer, binary.BigEndian, &num), "BytesToUint")
	return num
}
