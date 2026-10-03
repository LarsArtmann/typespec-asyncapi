{
  description = "TypeSpec emitter for AsyncAPI 3.1 specifications";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs-lib.follows = "nixpkgs";
    };
    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs@{
      self,
      flake-parts,
      treefmt-nix,
      ...
    }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      # Inline systems: nixpkgs 26.11 dropped x86_64-darwin, which github:nix-systems/default still lists.
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
      ];

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
              prettier = {
                enable = true;
                # Generated report artifacts (review dashboards under docs/)
                # contain malformed HTML that crashes the prettier parser;
                # archives are point-in-time exports, never formatted.
                excludes = [ "docs/**/*.html" ];
              };
            };
          };

          checks.format = config.treefmt.build.check self;

          devShells = {
            default = pkgs.mkShellNoCC {
              name = "typespec-asyncapi-dev";

              packages = [
                pkgs.pnpm
                pkgs.bun
                pkgs.nodejs_22
                pkgs.typescript
              ];
            };

            ci = pkgs.mkShellNoCC {
              packages = [
                pkgs.pnpm
                pkgs.bun
                pkgs.nodejs_22
              ];
            };
          };
        };
    };
}
