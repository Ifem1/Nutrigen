# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class NutrigenContract(gl.Contract):
    owner: str
    paused: bool
    request_counter: u256
    organisations: TreeMap[str, str]

    def __init__(self) -> None:
        self.owner = gl.message.sender_address.as_hex
        self.paused = False
        self.request_counter = u256(0)

    @gl.public.view
    def get_owner(self) -> str:
        return self.owner

    @gl.public.view
    def is_paused(self) -> bool:
        return self.paused

    @gl.public.write
    def pause(self) -> None:
        if gl.message.sender_address.as_hex.lower() != self.owner.lower():
            raise gl.vm.UserError("Only owner")
        self.paused = True

    @gl.public.write
    def unpause(self) -> None:
        if gl.message.sender_address.as_hex.lower() != self.owner.lower():
            raise gl.vm.UserError("Only owner")
        self.paused = False
