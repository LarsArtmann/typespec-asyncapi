{
  description = "TypeSpec emitter for AsyncAPI 3.0 specifications";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs-lib.follows = "nixpkgs";
    };
    systems.url = "github:nix-systems/default";
    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs@{
      self,
      flake-parts,
      systems,
      treefmt-nix,
      ...
    }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = import systems;

      imports = [
        treefmt-nix.flakeModule
      ];

      perSystem =
        {
          config,
          pkgs,
          ...
        }:
        {
          treefmt = {
            projectRootFile = "flake.nix";
            programs = {
              nixfmt.enable = true;
              prettier.enable = true;
            };
          };

          checks.format = config.treefmt.build.check self;

          devShells = {
            default = pkgs.mkShellNoCC {
              name = "typespec-asyncapi-dev";

              packages = [
                pkgs.bun
                pkgs.nodejs_22
                pkgs.typescript
              ];
            };

            ci = pkgs.mkShellNoCC {
              packages = [
                pkgs.bun
              ];
            };
          };
        };
    };
}
