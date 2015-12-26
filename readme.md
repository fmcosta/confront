# Confront

### Your environment configuration frontloader



(1) first a *realm* is established from the unix environment:

NODE_ENV | SERVER_ENV = 'development'
or from the execution context (command line)


(2) we read static configs and override in the following order:

- package.json{.config}
- config.json
- [realm].json


(3) then we read the command line options and override from there


