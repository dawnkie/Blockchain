package v3

import (
	"bytes"
	"encoding/binary"
	"fmt"
)

func UintToBytes(num uint64) []byte {
	var buffer bytes.Buffer
	HandleError(binary.Write(&buffer, binary.BigEndian, num), "UintToBytes")
	return buffer.Bytes()
}



func BytesToUint(bs []byte) uint64 {
	buffer := bytes.NewBuffer(bs)
	var num uint64
	HandleError(binary.Read(buffer, binary.BigEndian, &num), "BytesToUint")
	return num
}


func HandleError(err error, errInfo string) {
	if err != nil {
		fmt.Println("[ERROR]  - ", errInfo, ": ", err)
	}
}