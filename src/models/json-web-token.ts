export class JsonWebToken {

  static fromJson(json: any): JsonWebToken {
    json = json || {};

    const issuedDate = new Date(0);
    const expiresDate = new Date(0);
    issuedDate.setUTCSeconds(json.iat);
    expiresDate.setUTCSeconds(json.exp);

    const result = new JsonWebToken();

    result.email = json.email;
    result.domain = json.domain;
    result.firstName = json.firstName;
    result.lastName = json.lastName;
    result.id = json.id;
    result.stripeId = json.stid || '';
    result.salesForceId = json.sfid || '';
    result.issuerSignature = json.issSig;
    result.issued = issuedDate;
    result.expires = expiresDate;
    result.audience = json.aud;
    result.issuer = json.iss;
    result.jwtId = json.jti;

    return result;
  }

  email: string;
  domain: string;
  firstName: string;
  lastName: string;
  id: string;
  stripeId: string;
  salesForceId: string;
  issuerSignature: string;
  issued: Date;
  expires: Date;
  audience: string;
  issuer: string;
  jwtId: string;
}
