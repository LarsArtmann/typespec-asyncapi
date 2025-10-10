import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

namespace TestSecurity;

@message(#{
  name: "UserAuthenticated",
  title: "User Authentication Event"
})
model UserAuthenticated {
  userId: string;
  sessionId: string;
  token: string;
  expiresAt: utcDateTime;
}

@security(#{
  name: "oauth2",
  scheme: #{
    type: "oauth2",
    flows: #{
      authorizationCode: #{
        authorizationUrl: "https://auth.example.com/oauth/authorize",
        tokenUrl: "https://auth.example.com/oauth/token",
        scopes: #["profile", "email"]
      }
    }
  }
})
@channel("user.authenticated")
@publish
op publishUserAuthenticated(): UserAuthenticated;