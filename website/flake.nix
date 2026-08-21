{
  description = "gogenfilter website — Astro + Starlight";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    systems.url = "github:nix-systems/default";

    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs-lib.follows = "nixpkgs";
    };

    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    md-go-validator = {
      url = "github:LarsArtmann/md-go-validator";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs@{ self, flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = import inputs.systems;

      imports = [ inputs.treefmt-nix.flakeModule ];

      perSystem =
        {
          config,
          pkgs,
          ...
        }:
        let
          mdgo = inputs.md-go-validator.packages.${pkgs.stdenv.system}.default.overrideAttrs (_: {
            vendorHash = "sha256-r2hvS99DCP2DkLrMkRs4lOkvDk2tQI+CGQl89KM4ZBc=";
          });

          mkApp = name: runtimeInputs: text: {
            type = "app";
            program = "${
              pkgs.writeShellApplication {
                inherit name runtimeInputs text;
              }
            }/bin/${name}";
          };
        in
        {
          apps = {
            dev = mkApp "dev" [ pkgs.nodejs pkgs.pnpm ] "pnpm run dev";
            build = mkApp "build" [ pkgs.nodejs pkgs.pnpm ] "pnpm run build";
            preview = mkApp "preview" [ pkgs.nodejs pkgs.pnpm ] "pnpm run preview";
            deploy =
              mkApp "deploy"
                [
                  pkgs.nodejs
                  pkgs.pnpm
                  pkgs.firebase-tools
                ]
                ''
                  pnpm run build
                  firebase deploy --only hosting
                '';
            validate-docs = mkApp "validate-docs" [
              pkgs.nodejs
              pkgs.pnpm
              mdgo
            ] "md-go-validator -f table src/content/docs/";
          };

          devShells.default = pkgs.mkShellNoCC {
            packages = [
              pkgs.nodejs
              pkgs.pnpm
              pkgs.firebase-tools
              mdgo
            ];
          };

          treefmt = {
            programs = {
              nixfmt.enable = true;
            };
          };

          checks.format = config.treefmt.build.check self;
        };
    };
}
