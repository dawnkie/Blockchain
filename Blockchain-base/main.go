package main

import (
	v3 "main/v3"
)

func main() {
	//_, _ = DB.Exec("delete from block")                     // 清空表

	v3.BlockChain()
	v3.AddBlock("test")

}

